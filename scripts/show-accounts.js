// Script untuk menampilkan akun Ganache dengan private key
// Jalankan: node scripts/ganache-accounts.js

console.log("\n==========================================");
console.log("GANACHE TEST ACCOUNTS (100 ETH each)");
console.log("==========================================\n");
console.log("Copy salah satu Private Key di bawah ini");
console.log("lalu import ke MetaMask untuk transaksi GRATIS!\n");

// Default Ganache HD Wallet mnemonic accounts
// Mnemonic: "test test test test test test test test test test test junk"
const accounts = [
    {
        address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    },
    {
        address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    },
    {
        address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
    }
];

console.log("CATATAN: Jika akun Ganache Anda menggunakan mnemonic berbeda,");
console.log("buka Ganache GUI → klik ikon kunci di samping akun → copy Private Key\n");

accounts.forEach((acc, i) => {
    console.log(`Account #${i}:`);
    console.log(`  Address:     ${acc.address}`);
    console.log(`  Private Key: ${acc.privateKey}`);
    console.log("");
});

console.log("==========================================");
console.log("LANGKAH CEPAT (1 MENIT):");
console.log("==========================================");
console.log("1. Buka Ganache GUI");
console.log("2. Klik ikon 🔑 (kunci) di samping akun manapun");
console.log("3. Copy Private Key yang muncul");
console.log("4. Buka MetaMask → Klik profil → Import Account");
console.log("5. Paste Private Key → Import");
console.log("6. Refresh halaman web dan coba transaksi!");
console.log("==========================================\n");
