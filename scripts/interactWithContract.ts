import { ethers } from "ethers"



async function balance() {

    const address = "0xc3fB9F429Faa1810F390c3f55E385479ca5059d0"

    const provider = ethers.getDefaultProvider()

    var balanceContract = ethers.utils.formatEther( await provider.getBalance(address))

    return { balanceContract }
} 

 balance().then((x)=> console.log(x.balanceContract))

