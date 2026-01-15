const hre = require("hardhat");

async function main() {
  console.log("\n==========================================");
  console.log("DEPLOYING GUESTBOOK CONTRACT");
  console.log("==========================================\n");

  const Guestbook = await hre.ethers.getContractFactory("Guestbook");
  const guestbook = await Guestbook.deploy();
  await guestbook.waitForDeployment();

  const contractAddress = await guestbook.getAddress();

  console.log("✅ Guestbook deployed to:", contractAddress);
  console.log("\n==========================================");
  console.log("PENTING: Update alamat contract di app.js");
  console.log("==========================================");
  console.log(`const contractAddress = "${contractAddress}";`);
  console.log("==========================================\n");

  // Save contract address to file
  const fs = require("fs");
  fs.writeFileSync("deployed-address.txt", contractAddress);
  console.log("Alamat contract disimpan di: deployed-address.txt");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
