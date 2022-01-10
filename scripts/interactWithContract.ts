import { BigNumber } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers } from "hardhat"

import {abi} from '../artifacts/contracts/ETHPool.sol/ETHPool.json'



var addressContract : string = ""

async function balance() {

    
    var deposito: BigNumber = ethers.utils.parseEther("10")

    const [owner, user1, user2, user3, user4] =  await ethers.getSigners()
    var userArray: SignerWithAddress[] = [owner, user1, user2, user3, user4]

    const ETHPoolFactory = await ethers.getContractFactory("ETHPool");
    const ETHPoolDeploy = await ETHPoolFactory.deploy();

    addressContract = ETHPoolDeploy.address
    
    for (const item of userArray){
        await ETHPoolDeploy.connect(item).depositarEthUsuario({ value: deposito })
    }
    // leer los eventos especificos de un contrato
    // let eventFilter = ETHPoolDeploy.filters.DepositoEthUsuario()
    // let events = await ETHPoolDeploy.queryFilter(eventFilter)

    var balanceETHEquipo = await ETHPoolDeploy.totalRecompensa()
    var balanceUsuarios = await ETHPoolDeploy.totalDepositosUsuarios()
    var totalETHBloqueado  = balanceETHEquipo.add(balanceETHEquipo)

    var mensaje  = "Total ETH bloquedao : " 
                    +ethers.utils.formatEther(totalETHBloqueado) + " | " 
                    +"Total ETH Equipo bloquedo : " 
                    +ethers.utils.formatEther(balanceETHEquipo) + " | "
                    +"Total ETH Usuarios bloqueado : "
                    +ethers.utils.formatEther(balanceUsuarios)


    return { mensaje }
} 

 balance().then((x)=> console.log(x.mensaje))

