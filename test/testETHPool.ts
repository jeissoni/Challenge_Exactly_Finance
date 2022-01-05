
import { ethers } from "hardhat";
import { expect } from 'chai'
import { BigNumber } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


function getRandomArbitrary(min:number , max : number) {
    
    return Math.floor(Math.random() * max) + min;
}



describe("test of ETHPools", function () {


    const dataETHPool = async () => {
        const [owner, user1, user2, user3, user4] = await ethers.getSigners();
        const ETHPoolFactory = await ethers.getContractFactory("ETHPool");
        const ETHPoolDeploy = await ETHPoolFactory.deploy();
        const ganaciasDepositadas: BigNumber = ethers.utils.parseEther("10")


        return {
            owner,
            user1, user2, user3, user4,
            ETHPoolDeploy, 
            ganaciasDepositadas
        }
    }

    describe("test funcionalidad del equipo", function () {
        it('La cuenta que despliega es la cuenta del equipo', async () => {
            const { owner, user1, ETHPoolDeploy } = await dataETHPool()

            const esOwnerEquipo: boolean = await ETHPoolDeploy.usuariosEquipo(owner.address)
            const esUser1Equipo: boolean = await ETHPoolDeploy.usuariosEquipo(user1.address)

            expect(esOwnerEquipo).to.equal(true)
            expect(esUser1Equipo).to.equal(false)
        })

        it('El equipo NO puede depositar antes de una semana', async () => {
            const { ETHPoolDeploy , ganaciasDepositadas} = await dataETHPool()            

            await expect(ETHPoolDeploy.depositarGananciasEquipo({ value: ganaciasDepositadas })).to.be.revertedWith("No ha pasado una semana!")
        })

        it('El equipo SI puede depositar despues de una semana', async () => {
            const { ETHPoolDeploy, ganaciasDepositadas } = await dataETHPool()

            await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7) + 1])            

            await ETHPoolDeploy.depositarGananciasEquipo({ value: ganaciasDepositadas })

            const ganaciasContrato: BigNumber = await ETHPoolDeploy.totalRecompensa()

            expect(ganaciasDepositadas).to.equal(ganaciasContrato)
        })
    })


    describe("test funcionalidad de usuarios", function () {


        describe("Depositar", function () {
            it("Se puede depositar por los usuarios", async () => {

                const { user1, ETHPoolDeploy } = await dataETHPool()

                const depositoUsuario: BigNumber = ethers.utils.parseEther("10")

                const antesTotalDepositosUsuarios = await ETHPoolDeploy.totalDepositosUsuarios()

                const tx = await ETHPoolDeploy.connect(user1).depositarEthUsuario({ value: depositoUsuario })

                const timestamp = (await ethers.provider.getBlock(tx.blockNumber)).timestamp;

                var depositoUsuarioContrato = await ETHPoolDeploy.usuarios(user1.address)

                expect(depositoUsuarioContrato.deposito).to.equal(depositoUsuario)
                expect(depositoUsuarioContrato.fechaDeposito).to.equal(timestamp)
                expect(await ETHPoolDeploy.totalDepositosUsuarios()).to.equal(antesTotalDepositosUsuarios + depositoUsuario)
            })
        })



        describe("Retirar", function () {
           
            it("Restringir si no hay fondos depositados por el equipo", async () => {
                const { user1, ETHPoolDeploy } = await dataETHPool()
                await expect(ETHPoolDeploy.connect(user1).retirarDepositoMasGanancias()).to.be.revertedWith("No hay recompensas por entregar")
            })

            it("Restringir si el usuario no ha depositado nada", async () => {    
                const { owner, user1, ETHPoolDeploy, ganaciasDepositadas } = await dataETHPool()

                await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7) + 1]) 
                await ETHPoolDeploy.connect(owner).depositarGananciasEquipo({ value: ganaciasDepositadas })

                await expect(ETHPoolDeploy.connect(user1).retirarDepositoMasGanancias()).to.be.revertedWith("EL usuarion no a depositado")                                
            })

            it("Restringir si el usuario deposito despues del ultimo deposito del equipo", async () => {    
                const { owner, user1, ETHPoolDeploy, ganaciasDepositadas } = await dataETHPool()

                await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7) + 1]) 
                await ETHPoolDeploy.connect(owner).depositarGananciasEquipo({ value: ganaciasDepositadas })


                await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 1)]) 
                await ETHPoolDeploy.connect(user1).depositarEthUsuario({ value: ganaciasDepositadas })


                await expect(ETHPoolDeploy.connect(user1).retirarDepositoMasGanancias()).to.be.revertedWith("No deposito a tiempo para la recompensa actual")                                
            })

            it("Entrega de depositos", async () => {    
                const { owner, user1, user2, user3, user4, ETHPoolDeploy } = await dataETHPool()
                         
                interface userDeposito {
                    user: SignerWithAddress;
                    value: BigNumber;
                }

                const eth =  ethers.constants.WeiPerEther;

                var totalRecompensa : BigNumber = ethers.utils.parseEther("10")

                var userDepositoArray: userDeposito[] = new Array();

                var userArray : SignerWithAddress[] = [user1,user2,user3,user4] 

                var totalDespositoUsuario : BigNumber = ethers.constants.Zero; //0
             


                // deposito de usuario, cantidad de ETH al azar 
                // valor entre 1 y 10 ETH
                for(const item of userArray){
                    var depositoUsuario : BigNumber = ethers.utils.parseEther(
                        getRandomArbitrary(1,10).toString())
                   
                    var tx = await ETHPoolDeploy.connect(item).depositarEthUsuario({ 
                        value:  depositoUsuario.toString()
                    })                 

                    userDepositoArray.push({
                        user:item ,
                        value :depositoUsuario,
                    })                    

                    totalDespositoUsuario = totalDespositoUsuario.add(depositoUsuario)
                }             

               
                // deposito del la recompensa por parte del equipo
                await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7) + 1]) 

                await ETHPoolDeploy.connect(owner).depositarGananciasEquipo({ 
                    value: totalRecompensa.toString() })



                // retiro de los usuarios 
                for (const item of userDepositoArray){
                    
                    var porcentajePool : BigNumber = item.value.mul(eth).div(totalDespositoUsuario)                  

                    var balanceUserAntes = await ethers.provider.getBalance(item.user.address)

                    var ganaciasMasDeposito : BigNumber =
                    item.value.add(totalRecompensa.mul(porcentajePool).div(eth))     

                    var tx = await ETHPoolDeploy.connect(item.user).retirarDepositoMasGanancias()

                    totalDespositoUsuario = totalDespositoUsuario.sub(item.value)

                    totalRecompensa = totalRecompensa.sub(totalRecompensa.mul(porcentajePool).div(eth))

                    const gasUsed :BigNumber = (await tx.wait()).gasUsed
                    const gasPrice : BigNumber = tx.gasPrice
                    var gasCost : BigNumber = gasUsed.mul(gasPrice)

                    var balanceUsuario = await ethers.provider.getBalance(item.user.address)

                    balanceUserAntes = balanceUserAntes.add(ganaciasMasDeposito.sub(gasCost))                 

                    expect(balanceUserAntes).to.equal(balanceUsuario)

                }
               
            })









        })




    })


})


