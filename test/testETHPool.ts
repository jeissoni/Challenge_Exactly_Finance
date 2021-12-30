
import { ethers } from "hardhat";
import { expect } from 'chai'
import { BigNumber } from "ethers"

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

            it("Restringir si el usuario deposito despues del ultimo deposito del equipo", async () => {    
                const { owner, user1, user2, user3, user4, ETHPoolDeploy, ganaciasDepositadas } = await dataETHPool()

                var listUser = [user1, user2, user3, user4]

                listUser.forEach(user => {
                    
                    const randomNumber = Math.random() * (20 - 1) + 1 
                    const ganaciasDepositadas: BigNumber = ethers.utils.parseEther(randomNumber.toString())
                    ETHPoolDeploy.connect(user).depositarEthUsuario({ value: ganaciasDepositadas })

                })
                

                await ETHPoolDeploy.connect(user1).depositarEthUsuario({ value: ganaciasDepositadas })


                await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7) + 1]) 
                await ETHPoolDeploy.connect(owner).depositarGananciasEquipo({ value: ganaciasDepositadas })


                await expect(ETHPoolDeploy.connect(user1).retirarDepositoMasGanancias()).to.be.revertedWith("No deposito a tiempo para la recompensa actual")                                
            })









        })




    })


})


