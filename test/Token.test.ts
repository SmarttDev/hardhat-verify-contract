import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { MyToken } from "../typechain";

describe("MyToken contract", function () {
  let MyTokenContract;
  let MyTokenInstance: MyToken;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async () => {
    // Get the ContractFactory and Signers here.
    MyTokenContract = await ethers.getContractFactory("MyToken");
    [owner, addr1, addr2] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    MyTokenInstance = await MyTokenContract.deploy("1000000000000000000000");
  });

  describe("Deployment", function () {
    it("Should assign the name of token 'My Hardhat Token'", async () => {
      expect(await MyTokenInstance.name()).to.equal("My Hardhat Token");
    });

    it("Should assign the symbol of token 'MBT'", async () => {
      expect(await MyTokenInstance.symbol()).to.equal("MBT");
    });

    it("Should assign the total supply of tokens to the owner", async () => {
      const ownerBalance = await MyTokenInstance.balanceOf(
        await owner.getAddress()
      );
      expect(await MyTokenInstance.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      await MyTokenInstance.transfer(await addr1.getAddress(), 50);
      const addr1Balance = await MyTokenInstance.balanceOf(
        await addr1.getAddress()
      );
      expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await MyTokenInstance.connect(addr1).transfer(
        await addr2.getAddress(),
        50
      );
      const addr2Balance = await MyTokenInstance.balanceOf(
        await addr2.getAddress()
      );
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const ownerAddr = await owner.getAddress();
      const initialOwnerBalance = await MyTokenInstance.balanceOf(ownerAddr);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        MyTokenInstance.connect(addr1).transfer(ownerAddr, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      // Owner balance shouldn't have changed.
      expect(await MyTokenInstance.balanceOf(ownerAddr)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function () {
      const ownerAddr = await owner.getAddress();
      const addr1Addr = await addr1.getAddress();
      const addr2Addr = await addr2.getAddress();

      const initialOwnerBalance: any = await MyTokenInstance.balanceOf(
        ownerAddr
      );

      // Transfer 100 smaller unit tokens (Wei if 10e18) from owner to addr1.
      await MyTokenInstance.transfer(addr1Addr, 100);

      // Transfer another 50 smaller unit tokens (Wei if 10e18) from owner to addr2.
      await MyTokenInstance.transfer(addr2Addr, 50);

      // Check balances.
      const finalOwnerBalance = await MyTokenInstance.balanceOf(ownerAddr);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));

      const addr1Balance = await MyTokenInstance.balanceOf(addr1Addr);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await MyTokenInstance.balanceOf(addr2Addr);
      expect(addr2Balance).to.equal(50);
    });
  });
});
