

import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

// 1. KONFIGURASI
const contractAddress = "0xBD87961C2f8E3908e59A04019A33376FB465c2a0"; // Ganti dengan alamat contract hasil deploy di Sepolia
const abi = [
    "function postMessage(string memory _text) public",
    "function getMessages() public view returns (tuple(address sender, string text, uint256 timestamp)[])"
];

let contract;
let userAddress = null;
let provider;

// 2. FUNGSI KONEKSI WALLET
async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("MetaMask tidak ditemukan!");
      return;
    }

    // Request akun MetaMask
    await window.ethereum.request({ method: "eth_requestAccounts" });

    provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    // Pastikan user di Sepolia
    const network = await provider.getNetwork();
    if (network.chainId !== 11155111n) {
      alert("❌ Harap pindah ke Sepolia Testnet di MetaMask");
      return;
    }

    document.getElementById("walletAddress").innerText =
      `Connected: ${userAddress}`;
    document.getElementById("connectButton").innerText =
      "Wallet Terhubung ✓";

    contract = new ethers.Contract(
      contractAddress,
      abi,
      signer
    );

    console.log("✅ Connected to Sepolia via MetaMask");
    loadMessages();

  } catch (error) {
    console.error("Koneksi gagal:", error);
    alert("❌ Gagal terhubung ke MetaMask");
  }
}

// 3. FUNGSI KIRIM PESAN (GRATIS - gas dibayar oleh sponsor)
async function sendMessage() {
    const text = document.getElementById("messageInput").value;
    if (!text) return alert("Pesan tidak boleh kosong!");
    if (!contract) return alert("Hubungkan wallet dulu!");

    try {
        document.getElementById("sendButton").innerText = "⏳ Memproses...";
        document.getElementById("sendButton").disabled = true;

        // Kirim transaksi menggunakan sponsor wallet (GRATIS untuk user!)
        const tx = await contract.postMessage(text);
        await tx.wait();

        document.getElementById("messageInput").value = "";
        document.getElementById("sendButton").innerText = "✓ TRANSMIT TO NETWORK >";
        document.getElementById("sendButton").disabled = false;

        // Tampilkan notifikasi sukses
        showNotification("✅ Pesan berhasil disimpan ke blockchain!");

        loadMessages();
    } catch (error) {
        console.error(error);
        document.getElementById("sendButton").innerText = "✓ TRANSMIT TO NETWORK >";
        document.getElementById("sendButton").disabled = false;

        if (error.message.includes("could not coalesce error") || error.message.includes("ECONNREFUSED")) {
            alert("❌ Ganache tidak berjalan!\n\nJalankan Ganache di port 7545 dan deploy ulang contract.");
        } else {
            alert("❌ Transaksi gagal: " + error.message);
        }
    }
}

// 4. FUNGSI AMBIL DATA DARI BLOCKCHAIN
async function loadMessages() {
    try {
        console.log("📥 Loading messages from blockchain...");

        if (!contract) {
            console.log("⚠️ Contract not ready, skipping load");
            return;
        }

        const messages = await contract.getMessages();
        console.log("📦 Raw messages:", messages);
        console.log(`✅ Found ${messages.length} messages`);

        const list = document.getElementById("messagesList");
        if (!list) {
            console.error("❌ messagesList element not found!");
            return;
        }

        const loadingStatus = document.getElementById("loadingStatus");
        if (loadingStatus) loadingStatus.style.display = "none";

        // Bersihkan daftar lama
        const items = list.querySelectorAll(".message-item");
        items.forEach(el => el.remove());

        if (messages.length === 0) {
            const emptyDiv = document.createElement("div");
            emptyDiv.className = "text-center text-gray-500 py-8 font-mono text-sm";
            emptyDiv.innerHTML = `<i class="fas fa-inbox text-4xl mb-4 block opacity-50"></i>No messages yet. Be the first to broadcast!`;
            list.appendChild(emptyDiv);
            return;
        }

        // Reverse untuk menampilkan pesan terbaru di atas
        const reversedMessages = [...messages].reverse();

        reversedMessages.forEach((msg, index) => {
            const timestamp = Number(msg.timestamp);
            const date = new Date(timestamp * 1000).toLocaleString('id-ID');
            const div = document.createElement("div");
            div.className = "message-item p-6 rounded-lg mb-4";
            div.style.animationDelay = `${index * 0.1}s`;
            div.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-mono" style="color: var(--neon-blue);">
                        <i class="fas fa-user-circle mr-2"></i>
                        ${msg.sender.substring(0, 6)}...${msg.sender.substring(38)}
                    </p>
                    <span class="text-[10px] font-mono text-gray-500">
                        <i class="fas fa-clock mr-1"></i>${date}
                    </span>
                </div>
                <p class="text-lg text-white mt-2">${msg.text}</p>
            `;
            list.appendChild(div);
            console.log(`📝 Message ${index + 1}: "${msg.text}" from ${msg.sender}`);
        });

        console.log(`✅ Displayed ${messages.length} messages`);
    } catch (error) {
        console.error("❌ Gagal mengambil pesan:", error);
        const list = document.getElementById("messagesList");
        if (list) {
            list.innerHTML = `<div class="text-center text-red-400 py-8 font-mono text-sm">
                <i class="fas fa-exclamation-triangle text-4xl mb-4 block"></i>
                Error loading messages. Check console for details.
            </div>`;
        }
    }
}

// 5. FUNGSI NOTIFIKASI
function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse";
    notification.innerText = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Event Listeners
document.getElementById("connectButton").onclick = connectWallet;
document.getElementById("sendButton").onclick = sendMessage;

// Auto-connect jika sudah ada provider
window.addEventListener("load", () => {
    console.log("🚀 Immutable Wall v3.0 - Gasless Edition");
    console.log("📝 Transaksi GRATIS - gas dibayar oleh sponsor wallet");
});