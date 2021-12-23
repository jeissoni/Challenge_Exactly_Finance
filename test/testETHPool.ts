
import { ethers } from "hardhat";
import chai, { expect } from 'chai'




const contractFactory = await ethers.getContractFactory("contract");
const deployed = await contractFactory.deploy();