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
    const title = document.getElementById("titleInput").value;
    const text = document.getElementById("messageInput").value;
    
    if (!title) return alert("Judul tidak boleh kosong!");
    if (!text) return alert("Pesan tidak boleh kosong!");
    if (!contract) return alert("Hubungkan wallet dulu!");

    try {
        document.getElementById("sendButton").innerText = "⏳ Memproses...";
        document.getElementById("sendButton").disabled = true;

        // Kirim transaksi menggunakan sponsor wallet (GRATIS untuk user!)
        const fullMessage = `[${title}] ${text}`;
        const tx = await contract.postMessage(fullMessage);
        await tx.wait();

        document.getElementById("titleInput").value = "";
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
            
            // Parse title dari pesan (format: [title] content)
            const textMatch = msg.text.match(/^\[(.*?)\]\s*(.*)/);
            const title = textMatch ? textMatch[1] : "No Title";
            const content = textMatch ? textMatch[2] : msg.text;
            
            const div = document.createElement("div");
            div.className = "message-item mb-4 accordion-item";
            div.style.animationDelay = `${index * 0.1}s`;
            
            // Header (selalu terlihat)
            const header = document.createElement("div");
            header.className = "accordion-header p-4 rounded-lg cursor-pointer flex items-center justify-between transition-all hover:scale-102";
            header.innerHTML = `
                <div class="flex items-center gap-3 flex-1">
                    <span class="accordion-toggle transition-transform">
                        <i class="fas fa-chevron-right"></i>
                    </span>
                    <span class="text-lg font-semibold text-white">${title}</span>
                </div>
                <span class="text-[10px] font-mono text-gray-500 flex-shrink-0">
                    <i class="fas fa-clock mr-1"></i>${date}
                </span>
            `;
            
            // Content (tersembunyi awalnya)
            const contentDiv = document.createElement("div");
            contentDiv.className = "accordion-content hidden";
            contentDiv.innerHTML = `
                <div class="p-4 border-t border-gray-700">
                    <div class="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700">
                        <p class="text-sm font-mono" style="color: var(--neon-blue);">
                            <i class="fas fa-user-circle mr-2"></i>
                            ${msg.sender.substring(0, 6)}...${msg.sender.substring(38)}
                        </p>
                    </div>
                    <p class="text-gray-300 leading-relaxed">${content}</p>
                </div>
            `;
            
            // Event listener untuk toggle
            header.addEventListener("click", () => {
                contentDiv.classList.toggle("hidden");
                header.querySelector(".accordion-toggle").classList.toggle("rotate-90");
            });
            
            div.appendChild(header);
            div.appendChild(contentDiv);
            list.appendChild(div);
            console.log(`📝 Message ${index + 1}: Title="${title}" from ${msg.sender}`);
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
// Event Listeners utama
document.getElementById("connectButton").onclick = connectWallet;
document.getElementById("sendButton").onclick = sendMessage;

// Navigasi ke feed
document.getElementById("feedButton").onclick = () => {
    window.location.href = "feed.html";
};


// Auto-connect jika sudah ada provider
window.addEventListener("load", () => {
    console.log("🚀 Immutable Wall v3.0 - Gasless Edition");
    console.log("📝 Transaksi GRATIS - gas dibayar oleh sponsor wallet");
});