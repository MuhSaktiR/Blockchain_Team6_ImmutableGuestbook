// Script untuk mengirim ETH dari akun Ganache ke akun MetaMask Anda
// Jalankan: npx hardhat run scripts/fund-account.js --network ganache

const hre = require("hardhat");

async function main() {
    // Alamat MetaMask Anda yang perlu di-fund
    // GANTI dengan alamat MetaMask Anda!
    const targetAddress = process.argv[2] || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    console.log("\n==========================================");
    console.log("MENGIRIM ETH KE AKUN METAMASK");
    console.log("==========================================\n");

    const [sender] = await hre.ethers.getSigners();
    console.log("Pengirim:", sender.address);
    console.log("Penerima:", targetAddress);

    const tx = await sender.sendTransaction({
        to: targetAddress,
        value: hre.ethers.parseEther("10") // Kirim 10 ETH
    });

    await tx.wait();

    console.log("\n✅ Berhasil mengirim 10 ETH!");
    console.log("Transaction hash:", tx.hash);
    console.log("\nSekarang Anda bisa melakukan transaksi di aplikasi!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
