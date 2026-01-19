const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("🚀 Memulai proses deployment ke Sepolia Testnet...\n");

  if (!process.env.ALCHEMY_API_KEY || !process.env.SEPOLIA_MNEMONIC) {
    throw new Error("❌ Pastikan ALCHEMY_API_KEY dan SEPILIA_MNEMONIC sudah di .env");
  }

  const provider = new ethers.providers.JsonRpcProvider(
    `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
  );

  const wallet = ethers.Wallet.fromMnemonic(process.env.SEPOLIA_MNEMONIC).connect(provider);

  console.log("👤 Alamat Deployer :", wallet.address);

  const balance = await wallet.getBalance();
  console.log("💰 Saldo Deployer  :", ethers.utils.formatEther(balance), "ETH");

  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    console.warn("⚠️  Saldo rendah, gas mungkin tidak cukup!");
  }

  console.log("\n⏳ Menyiapkan kontrak Guestbook...");

  const Guestbook = await ethers.getContractFactory("Guestbook", wallet);

  const guestbook = await Guestbook.deploy();

  console.log("📨 Hash Transaksi Deploy :", guestbook.deployTransaction.hash);
  console.log("⏳ Menunggu konfirmasi deployment...");

  await guestbook.deployed();

  const contractAddress = guestbook.address;

  console.log("\n✅ Smart contract berhasil di-deploy!");
  console.log("📍 Alamat Kontrak   :", contractAddress);
  console.log("🌐 Network          : Sepolia Testnet");
  console.log("🔗 Chain ID         : 11155111");

  const filePath = path.join(__dirname, "..", "deployed-address.txt");
  fs.writeFileSync(filePath, contractAddress, "utf8");
  console.log("💾 Alamat kontrak disimpan ke deployed-address.txt");

  const code = await provider.getCode(contractAddress);
  console.log("📦 Bytecode Terpasang :", code.length > 10 ? "✅ YA" : "❌ TIDAK");

  console.log("\n🎉 Deployment selesai dengan sukses!");
  console.log("👉 Jangan lupa update contractAddress di frontend:", contractAddress);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ TERJADI KESALAHAN SAAT DEPLOY:");
    console.error(error);

    console.error("\n🔍 Kemungkinan penyebab:");
    console.error("1. Saldo Sepolia ETH tidak mencukupi");
    console.error("2. ALCHEMY_API_KEY salah atau belum diisi");
    console.error("3. MNEMONIC salah atau belum diisi");
    console.error("4. Koneksi internet bermasalah");

    process.exit(1);
  });
