
import { ethers } from "hardhat";
import chai, { expect } from 'chai'
import { BigNumber } from "ethers"


describe("test of ETHPools" , function() {


    const dataETHPool = async()=>{
        const [owner, user1] = await ethers.getSigners();
        const ETHPoolFactory = await ethers.getContractFactory("ETHPool");
        const ETHPoolDeploy = await ETHPoolFactory.deploy();

        return{
            owner,
            user1, 
            ETHPoolDeploy
        }
    }

    describe("test funcionalidad del equipo", function(){
        it('La cuenta que despliega es la cuenta del equipo', async() => {
            const {owner, user1, ETHPoolDeploy} = await dataETHPool()

            const esOwnerEquipo : boolean = await ETHPoolDeploy.usuariosEquipo(owner.address)
            const esUser1Equipo : boolean = await ETHPoolDeploy.usuariosEquipo(user1.address)        

            expect(esOwnerEquipo).to.equal(true)
            expect(esUser1Equipo).to.equal(false)
        })

        it('El equipo solo puede depositar despues de una semana', async() =>{
            const {owner, ETHPoolDeploy} = await dataETHPool()

            await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7)+1])

            const ganaciasDepositadas: BigNumber = ethers.utils.parseEther("10") 

            await ETHPoolDeploy.depositarGananciasEquipo({value:ganaciasDepositadas})

            const ganaciasContrato : BigNumber = await ETHPoolDeploy.totalRecompensa()

            expect(ganaciasDepositadas).to.equal(ganaciasContrato)

        })
    })

    
    describe("test funcionalidad de usuarios", function(){
    })


})


