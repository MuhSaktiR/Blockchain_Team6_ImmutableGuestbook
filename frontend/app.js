import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

// ====================== CONFIG ======================
const contractAddress = "0x2b81C9107d72ad64D753F3B7633375698d30b61f"; 
const abi = [
    "function postMessage(string memory _text) public",
    "function getMessages() public view returns (tuple(address sender, string text, uint256 timestamp)[])",
    "function getAlias(address user) external view returns (string)"
];

let provider;
let signer;
let contract;
let userAddress = null;

// ====================== BANNED WORDS ======================
const bannedWords = [
    "sex","seks","ngentot","entot","kontol","memek","toket","tetek",
    "penis","vagina","masturbasi","coli","bokep","porn","porno","jav",
    "xnxx","xvideos","onlyfans",
    "anjing","bangsat","bajingan","tolol","goblok","idiot","brengsek",
    "kampret","tai","kont","fuck","shit","bitch","asshole","motherfucker",
    "cina","nigger","negro","kafir","infidel","yahudi","zionis",
    "hitler","nazi","terrorist","isis","jihad bunuh diri"
];

const bannedPatterns = [
    /s[\W_]*e[\W_]*x/i,
    /p[\W_]*o[\W_]*r[\W_]*n/i,
    /n[\W_]*g[\W_]*e[\W_]*n[\W_]*t[\W_]*o[\W_]*t/i,
    /k[\W_]*o[\W_]*n[\W_]*t[\W_]*o[\W_]*l/i
];

function normalizeLeet(text){
    const map={"0":"o","1":"i","3":"e","4":"a","5":"s","6":"g","7":"t","8":"b","9":"g"};
    return text.toLowerCase().split("").map(c=>map[c]||c).join("");
}

function validateContent(text){
    const normalized = normalizeLeet(text).replace(/[^a-z0-9\s]/gi,"");
    for(const w of bannedWords) if(normalized.includes(w)) return `Konten mengandung kata terlarang: "${w}"`;
    for(const p of bannedPatterns) if(p.test(text)) return "Konten mengandung unsur pornografi / ujaran kebencian";
    return null;
}

// ====================== INIT CONTRACT ======================
async function initContract(){
    if(!window.ethereum) throw new Error("MetaMask tidak ditemukan!");
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();
    contract = new ethers.Contract(contractAddress, abi, signer);
    localStorage.setItem("wallet", userAddress); // simpan wallet
    const network = await provider.getNetwork();
    if(network.chainId!==11155111n) alert("Harap pindah ke Sepolia Testnet di MetaMask");
}

// ====================== ALIAS ======================
async function getAliasSafe(addr){
    try{
        const a = await contract.getAlias(addr);
        return a && a.length>0 ? a : `${addr.substring(0,6)}...${addr.substring(38)}`;
    }catch(err){
        console.error("Gagal ambil alias:",err);
        return `${addr.substring(0,6)}...${addr.substring(38)}`;
    }
}

async function loadAlias(){
    if(!userAddress) return;
    const aliasLabel=document.getElementById("aliasLabel");
    aliasLabel.innerText = "👤 " + await getAliasSafe(userAddress);
}

// ====================== WALLET ======================
async function connectWallet(){
    try{
        await window.ethereum.request({ method:"eth_requestAccounts" });
        await initContract();
        document.getElementById("walletAddress").innerText = `Connected: ${userAddress}`;
        document.getElementById("connectButton").innerText = "Wallet Terhubung ✓";
        await loadAlias();
        await loadMessages();
    }catch(err){
        console.error("Koneksi gagal:",err);
        alert("Gagal terhubung ke MetaMask");
    }
}

// ====================== SEND MESSAGE ======================
async function sendMessage(){
    const title=document.getElementById("titleInput").value.trim();
    const text=document.getElementById("messageInput").value.trim();
    if(!title || !text){ alert("Judul dan pesan tidak boleh kosong!"); return; }
    if(!contract){ alert("Wallet belum terhubung"); return; }
    const tErr=validateContent(title);
    if(tErr){ alert(tErr); return; }
    const mErr=validateContent(text);
    if(mErr){ alert(mErr); return; }

    try{
        const btn=document.getElementById("sendButton");
        btn.disabled=true; btn.innerText="⏳ Memproses...";
        const tx=await contract.postMessage(`[${title}] ${text}`);
        await tx.wait();
        btn.disabled=false; btn.innerText="✓ TRANSMIT TO NETWORK >";
        document.getElementById("titleInput").value="";
        document.getElementById("messageInput").value="";
        showNotification("Pesan berhasil disimpan!");
        await loadMessages();
    }catch(err){
        console.error(err);
        alert("Transaksi gagal");
    }
}

// ====================== LOAD MESSAGES ======================
async function loadMessages(){
    if(!contract) return;
    const list=document.getElementById("messagesList");
    if(!list) return;
    list.innerHTML="";
    const msgs=await contract.getMessages();
    if(msgs.length===0){ 
        list.innerHTML='<div class="text-center text-gray-500 py-8 font-mono text-sm"><i class="fas fa-inbox text-4xl mb-4 block opacity-50"></i>No messages yet.</div>';
        return;
    }
    const reversed=[...msgs].reverse();
    const aliases=await Promise.all(reversed.map(m=>getAliasSafe(m.sender)));
    reversed.forEach((m,i)=>{
        const ts=new Date(Number(m.timestamp)*1000).toLocaleString('id-ID');
        const match=m.text.match(/^\[(.*?)\]\s*(.*)/);
        const title=match?match[1]:"No Title";
        const content=match?match[2]:m.text;
        const displayName=aliases[i];

        const div=document.createElement("div");
        div.className="message-item mb-4 accordion-item";
        div.style.animationDelay=`${i*0.1}s`;

        const header=document.createElement("div");
        header.className="accordion-header p-4 rounded-lg cursor-pointer flex items-center justify-between transition-all hover:scale-102";
        header.innerHTML=`
            <div class="flex items-center gap-3 flex-1">
                <span class="accordion-toggle transition-transform"><i class="fas fa-chevron-right"></i></span>
                <span class="text-lg font-semibold text-white">${title}</span>
            </div>
            <span class="text-[10px] font-mono text-gray-500 flex-shrink-0">
                <i class="fas fa-clock mr-1"></i>${ts}
            </span>
        `;
        const contentDiv=document.createElement("div");
        contentDiv.className="accordion-content hidden";
        contentDiv.innerHTML=`
            <div class="p-4 border-t border-gray-700">
                <div class="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700">
                    <p class="text-sm font-mono" style="color: var(--neon-blue);"><i class="fas fa-user-circle mr-2"></i>${displayName}</p>
                </div>
                <p class="text-gray-300 leading-relaxed">${content}</p>
            </div>
        `;
        header.addEventListener("click",()=>{contentDiv.classList.toggle("hidden");header.querySelector(".accordion-toggle").classList.toggle("rotate-90");});
        div.appendChild(header);
        div.appendChild(contentDiv);
        list.appendChild(div);
    });
}

// ====================== NOTIFICATION ======================
function showNotification(msg){
    const n=document.createElement("div");
    n.className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse";
    n.innerText=msg;
    document.body.appendChild(n);
    setTimeout(()=>n.remove(),3000);
}

// ====================== EVENT LISTENERS ======================
document.getElementById("connectButton").onclick=connectWallet;
document.getElementById("sendButton").onclick=sendMessage;

// Auto connect jika wallet tersimpan
window.addEventListener("load",async()=>{
    const saved=localStorage.getItem("wallet");
    if(saved && window.ethereum){
        try{
            await initContract();
            document.getElementById("walletAddress").innerText=`Connected: ${userAddress}`;
            document.getElementById("connectButton").innerText="Wallet Terhubung ✓";
            await loadAlias();
            await loadMessages();
        }catch(err){ console.error(err); }
    }
});

// Navigasi ke feed
document.getElementById("feedButton").onclick = () => {
    window.location.href = "feed.html";
};

window.addEventListener("load", async () => {
    const savedWallet = localStorage.getItem("wallet");

    if (savedWallet && window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            userAddress = await signer.getAddress();

            // Pastikan wallet aktif sama dengan wallet tersimpan
            if (userAddress.toLowerCase() !== savedWallet.toLowerCase()) {
                console.warn("Wallet aktif berbeda dengan wallet tersimpan");
                aliasLabel.innerText = "👤 WALLET NOT CONNECTED";
                return;
            }

            // Buat contract
            contract = new ethers.Contract(contractAddress, abi, signer);

            // Ambil alias
            await loadAlias();

            // Load pesan
            loadMessages();

            document.getElementById("walletAddress").innerText =
                `Connected: ${userAddress}`;
            document.getElementById("connectButton").innerText =
                "Wallet Terhubung ✓";

            console.log("🔁 Auto-connected wallet:", userAddress);

        } catch (err) {
            console.error("Auto-connect gagal:", err);
            aliasLabel.innerText = "👤 ERROR";
        }
    } else {
        aliasLabel.innerText = "👤 WALLET NOT CONNECTED";
    }
});

// ====================== INIT ======================
async function init(){
    if(!window.ethereum){
        document.getElementById("aliasLabel").innerText="👤 WALLET NOT FOUND";
        return;
    }

    try {
        provider = new ethers.BrowserProvider(window.ethereum);

        // Jika ada wallet tersimpan, pakai itu
        const saved = localStorage.getItem("wallet");
        if(saved){
            const accounts = await provider.send("eth_requestAccounts", []);
            if(accounts.length===0) throw new Error("Wallet disconnected");
            userAddress = accounts[0];
            if(userAddress.toLowerCase() !== saved.toLowerCase()){
                localStorage.removeItem("wallet");
                alert("Wallet berubah, silakan reload");
                return;
            }
        } else {
            const accounts = await provider.send("eth_requestAccounts", []);
            if(accounts.length===0) throw new Error("Wallet disconnected");
            userAddress = accounts[0];
            localStorage.setItem("wallet", userAddress);
        }

        signer = await provider.getSigner();
        contract = new ethers.Contract(contractAddress, abi, signer);

        // Tampilkan alias
        const alias = await contract.getAlias(userAddress);
        document.getElementById("aliasLabel").innerText = alias ? `👤 ${alias}` : `👤 ${userAddress.substring(0,6)}...${userAddress.slice(-4)}`;

        // Load feed
        await loadMessages();

        // Optional: tombol connect jadi disabled / berubah
        const btn = document.getElementById("connectButton");
        if(btn){
            btn.innerText = "Wallet Terhubung ✓";
            btn.disabled = true;
        }

    } catch(err){
        console.error("Auto-connect gagal:",err);
        document.getElementById("aliasLabel").innerText="👤 ERROR CONNECTING";
    }
}

// Panggil saat halaman load
window.addEventListener("load", init);

// Handle account change
if(window.ethereum){
    window.ethereum.on("accountsChanged", accounts=>{
        if(accounts.length===0){
            localStorage.removeItem("wallet");
            alert("Wallet disconnected");
            location.reload();
            return;
        }
        const newAcc = accounts[0];
        if(userAddress && newAcc.toLowerCase()!==userAddress.toLowerCase()){
            localStorage.removeItem("wallet");
            alert("Akun MetaMask diganti, reload untuk connect kembali");
            location.reload();
        }
    });
}
