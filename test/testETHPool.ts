
import { ethers } from "hardhat";
import chai, { expect } from 'chai'
import { BigNumber } from "ethers"

describe("test of ETHPools", function () {


    const dataETHPool = async () => {
        const [owner, user1] = await ethers.getSigners();
        const ETHPoolFactory = await ethers.getContractFactory("ETHPool");
        const ETHPoolDeploy = await ETHPoolFactory.deploy();

        return {
            owner,
            user1, 
            ETHPoolDeploy
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
            const { ETHPoolDeploy } = await dataETHPool()

            const ganaciasDepositadas: BigNumber = ethers.utils.parseEther("10")            

            await expect(ETHPoolDeploy.depositarGananciasEquipo({ value: ganaciasDepositadas })).to.be.revertedWith("No ha pasado una semana!")
        })

        it('El equipo SI puede depositar despues de una semana', async () => {
            const { ETHPoolDeploy } = await dataETHPool()

            await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7) + 1])

            const ganaciasDepositadas: BigNumber = ethers.utils.parseEther("10")

            await ETHPoolDeploy.depositarGananciasEquipo({ value: ganaciasDepositadas })

            const ganaciasContrato: BigNumber = await ETHPoolDeploy.totalRecompensa()

            expect(ganaciasDepositadas).to.equal(ganaciasContrato)
        })
    })


    describe("test funcionalidad de usuarios", function () {

        it('Se puede depositar por los usuarios', async () => {
           
            const {user1, ETHPoolDeploy} = await dataETHPool()         

            const depositoUsuario: BigNumber = ethers.utils.parseEther("10")          

            await ETHPoolDeploy.connect(user1).depositarEthUsuario({value :  depositoUsuario})

            var depositoUsuarioContrato  = await ETHPoolDeploy.usuarios(user1.address)

            expect(depositoUsuarioContrato.deposito).to.equal(depositoUsuario)
           
        })
    })


})


