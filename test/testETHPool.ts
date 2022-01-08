
import { ethers } from "hardhat";
import { expect } from 'chai'
import { BigNumber } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


function getRandomArbitrary(min: number, max: number) {

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
            const { ETHPoolDeploy, ganaciasDepositadas } = await dataETHPool()

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

            it("Restringir si el usuario no ha depositado nada", async () => {
                const { owner, user1, ETHPoolDeploy, ganaciasDepositadas } = await dataETHPool()

                await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7) + 1])
                await ETHPoolDeploy.connect(owner).depositarGananciasEquipo({ value: ganaciasDepositadas })

                await expect(ETHPoolDeploy.connect(user1).retirarDepositoMasGanancias()).to.be.revertedWith("EL usuarion no a depositado")
            })

            it("Entrega de depositos sin ganancias", async () => {
                const { user1, ETHPoolDeploy, ganaciasDepositadas } = await dataETHPool()

                //await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 1)])
                await ETHPoolDeploy.connect(user1).depositarEthUsuario({ value: ganaciasDepositadas })

                var balanceUsurAntes  =  await ethers.provider.getBalance(user1.address)

                var tx = await ETHPoolDeploy.connect(user1).retirarDepositoMasGanancias()

                const gasUsed: BigNumber = (await tx.wait()).gasUsed
                const gasPrice: BigNumber = tx.gasPrice
                var gasCost: BigNumber = gasUsed.mul(gasPrice)

                var balanceUsurDespues  =  await ethers.provider.getBalance(user1.address)

                expect(balanceUsurDespues).to.equal(balanceUsurAntes.add(ganaciasDepositadas).sub(gasCost))
                                
            })


            // prueba con 4 usuarios 
            // recompensa por parte del equipo 10 eth
            // deposito por partde de los usuarios de manera aleatoria (entre 1 y 10 eth)
            it("Entrega de rendimientos con depositos aleatorios", async () => {
                const { owner, user1, user2, user3, user4, ETHPoolDeploy } = await dataETHPool()

                interface userDeposito {
                    user: SignerWithAddress;
                    value: BigNumber;
                }

                const eth = ethers.constants.WeiPerEther;

                var totalRecompensa: BigNumber = ethers.utils.parseEther("10")

                var userDepositoArray: userDeposito[] = new Array();

                var userArray: SignerWithAddress[] = [user1, user2, user3, user4]

                var totalDespositoUsuario: BigNumber = ethers.constants.Zero;



                // deposito de usuario, cantidad de ETH al azar 
                // valor entre 1 y 10 ETH
                for (const item of userArray) {
                    var depositoUsuario: BigNumber = ethers.utils.parseEther(
                        getRandomArbitrary(1, 10).toString())

                    await ETHPoolDeploy.connect(item).depositarEthUsuario({
                        value: depositoUsuario.toString()
                    })

                    userDepositoArray.push({
                        user: item,
                        value: depositoUsuario,
                    })

                    totalDespositoUsuario = totalDespositoUsuario.add(depositoUsuario)
                }


                // deposito del la recompensa por parte del equipo
                await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7) + 1])

                await ETHPoolDeploy.connect(owner).depositarGananciasEquipo({
                    value: totalRecompensa.toString()
                })



                // retiro de los usuarios 
                for (const item of userDepositoArray) {

                    var porcentajePool: BigNumber = item.value.mul(eth).div(totalDespositoUsuario)

                    var balanceUserAntes = await ethers.provider.getBalance(item.user.address)

                    var ganaciasMasDeposito: BigNumber =
                        item.value.add(totalRecompensa.mul(porcentajePool).div(eth))

                    var tx = await ETHPoolDeploy.connect(item.user).retirarDepositoMasGanancias()

                    totalDespositoUsuario = totalDespositoUsuario.sub(item.value)

                    totalRecompensa = totalRecompensa.sub(totalRecompensa.mul(porcentajePool).div(eth))

                    const gasUsed: BigNumber = (await tx.wait()).gasUsed
                    const gasPrice: BigNumber = tx.gasPrice
                    var gasCost: BigNumber = gasUsed.mul(gasPrice)

                    var balanceUsuario = await ethers.provider.getBalance(item.user.address)

                    balanceUserAntes = balanceUserAntes.add(ganaciasMasDeposito.sub(gasCost))

                    expect(balanceUserAntes).to.equal(balanceUsuario)
                }

            })

            it("Retiro de depositos sin ganancias", async () => {
                const { owner, user1, user2, ETHPoolDeploy } = await dataETHPool()


                var totalRecompensa: BigNumber = ethers.utils.parseEther("10")

                // valor entre 1 y 10 ETH
                var depositoUsuario: BigNumber = ethers.utils.parseEther(
                    getRandomArbitrary(1, 10).toString())
                //------------------------------------------------------------


                //deposito usuario1    
                await ETHPoolDeploy.connect(user1).depositarEthUsuario({
                    value: depositoUsuario.toString()
                })
                //------------------------------------------------------------


                // deposito del la recompensa por parte del equipo
                await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7) + 1])

                await ETHPoolDeploy.connect(owner).depositarGananciasEquipo({
                    value: totalRecompensa.toString()
                })
                //------------------------------------------------------------                


                //retiro usuario1 
                //balance user1 - deposito - gas 
                var balanceUsuario1Antes = await ethers.provider.getBalance(user1.address)
                var tx = await ETHPoolDeploy.connect(user1).retirarDepositoMasGanancias()
                const gasUsedUser1: BigNumber = (await tx.wait()).gasUsed
                const gasPriceUser1: BigNumber = tx.gasPrice
                var gasCost: BigNumber = gasUsedUser1.mul(gasPriceUser1)

                balanceUsuario1Antes = balanceUsuario1Antes.add(totalRecompensa).add(depositoUsuario).sub(gasCost)
                var balanceUsuario1Despues = await ethers.provider.getBalance(user1.address)

                expect(balanceUsuario1Antes).to.equal(balanceUsuario1Despues)
                //------------------------------------------------------------



                //deposito usuario2
                await ETHPoolDeploy.connect(user2).depositarEthUsuario({
                    value: depositoUsuario.toString()
                })
                //------------------------------------------------------------


                //retiro usuario2
                var balanceUsuario2Antes = await ethers.provider.getBalance(user2.address)
                var tx = await ETHPoolDeploy.connect(user2).retirarDepositoMasGanancias()
                const gasUsedUser2: BigNumber = (await tx.wait()).gasUsed
                const gasPriceUser2: BigNumber = tx.gasPrice
                var gasCostUser2: BigNumber = gasUsedUser2.mul(gasPriceUser2)

                var balanceUsuario2Despues = await ethers.provider.getBalance(user2.address)
                balanceUsuario2Antes = balanceUsuario2Antes.add(depositoUsuario).sub(gasCostUser2)

                expect(balanceUsuario2Antes).to.equal(balanceUsuario2Despues)
                //------------------------------------------------------------


            })


        })

    })

})


