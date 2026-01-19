import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const contractAddress = "0x2b81C9107d72ad64D753F3B7633375698d30b61f";
const abi = [
  "function getPosts() public view returns (tuple(address author, string content, uint256 timestamp, uint256 likeCount, uint256 dislikeCount)[])",
  "function commentPost(uint256 postId, string text) public",
  "function getComments(uint256 postId) public view returns (tuple(address commenter, string text, uint256 timestamp)[])",
  "function getAlias(address user) public view returns (string memory)"
];

let provider;
let contract;
let activeWalletAddress = "";

// ====================== BANNED WORDS ======================
const bannedWords = [
  "sex", "seks", "ngentot", "entot", "kontol", "memek", "toket", "tetek",
  "penis", "vagina", "masturbasi", "coli", "bokep", "porn", "porno", "jav",
  "xnxx", "xvideos", "onlyfans",
  "anjing", "bangsat", "bajingan", "tolol", "goblok", "idiot", "brengsek",
  "kampret", "tai", "kont", "fuck", "shit", "bitch", "asshole", "motherfucker",
  "cina", "nigger", "negro", "kafir", "infidel", "yahudi", "zionis",
  "hitler", "nazi", "terrorist", "isis", "jihad bunuh diri"
];

const bannedPatterns = [
  /s[\W_]*e[\W_]*x/i,
  /p[\W_]*o[\W_]*r[\W_]*n/i,
  /n[\W_]*g[\W_]*e[\W_]*n[\W_]*t[\W_]*o[\W_]*t/i,
  /k[\W_]*o[\W_]*n[\W_]*t[\W_]*o[\W_]*l/i
];

function normalizeLeet(text) {
  const map = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "6": "g", "7": "t", "8": "b", "9": "g" };
  return text.toLowerCase().split("").map(c => map[c] || c).join("");
}

function validateContent(text) {
  const normalized = normalizeLeet(text).replace(/[^a-z0-9\s]/gi, "");
  for (const w of bannedWords) if (normalized.includes(w)) return `Konten mengandung kata terlarang: "${w}"`;
  for (const p of bannedPatterns) if (p.test(text)) return "Konten mengandung unsur pornografi / ujaran kebencian";
  return null;
}

const params = new URLSearchParams(window.location.search);
const postIndex = parseInt(params.get("postId"));

const aliasCache = {};

async function getAliasSafe(address) {
  address = address.toLowerCase();
  if (aliasCache[address]) return aliasCache[address];

  try {
    const a = await contract.getAlias(address);
    const alias = a && a.length > 0 ? a : `${address.slice(0, 6)}...${address.slice(-4)}`;
    aliasCache[address] = alias;
    localStorage.setItem(`alias_${address}`, alias); // optional cache
    return alias;
  } catch (err) {
    console.error("Gagal ambil alias:", err);
    const fallback = `${address.slice(0, 6)}...${address.slice(-4)}`;
    aliasCache[address] = fallback;
    return fallback;
  }
}



function postKey(msg) {
  return msg.author + "_" + msg.timestamp.toString();
}

function markCommented(pid, wallet) {
  localStorage.setItem(`commented_${wallet}_${pid}`, "yes");
}

async function renderActiveAccount(address) {
  activeWalletAddress = address;
  const el = document.getElementById("activeAddress");
  if (el) {
    const alias = await getAliasSafe(address); // ambil langsung dari blockchain
    el.innerText = alias;
    el.classList.add("font-mono", "text-purple-400");
    el.title = "Wallet address";
  }

  const avatarEl = document.getElementById("activeAvatar");
  if (avatarEl) avatarEl.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`;
}


async function loadComments(index) {
  const list = document.getElementById("commentList");
  list.innerHTML = "";

  const commentsData = await contract.getComments(index);
  if (!commentsData.length) {
    list.innerHTML = `<p class="text-xs text-gray-500">Belum ada komentar</p>`;
    return;
  }

  for (const c of commentsData) {
    const div = document.createElement("div");
    div.className = "glass p-3 rounded-xl mb-2";

    const name = await getAliasSafe(c.commenter);
    const time = new Date(Number(c.timestamp) * 1000).toLocaleString("id-ID");

    div.innerHTML = `
    <p class="text-xs text-purple-400 font-mono">${name}</p>
    <p class="text-sm mt-1">${c.text}</p>
    <p class="text-[10px] text-gray-500 mt-1">${time}</p>
  `;
    list.appendChild(div);
  }
}

async function initPost() {
  if (!window.ethereum) {
    alert("MetaMask tidak ditemukan");
    return;
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });
  provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  contract = new ethers.Contract(contractAddress, abi, signer);

  const address = (await signer.getAddress()).toLowerCase();

  const savedWallet = localStorage.getItem("wallet");
  if (savedWallet && savedWallet.toLowerCase() !== address.toLowerCase()) {
    alert("Wallet aktif berbeda dengan wallet login");
    return;
  }

  await renderActiveAccount(address); // <-- async sekarang

  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    alert("Gunakan Sepolia Testnet");
    return;
  }

  contract = new ethers.Contract(contractAddress, abi, provider); // untuk view method

  // ambil post
  const posts = await contract.getPosts();
  if (!posts.length || postIndex >= posts.length) {
    alert("Post tidak ditemukan di blockchain");
    return;
  }

  const post = posts[postIndex];
  const date = new Date(Number(post.timestamp) * 1000).toLocaleString("id-ID");
  const parsed = post.content.match(/^\[(.*?)\]\s*(.*)/);
  const title = parsed ? parsed[1] : "Immutable Post";
  const content = parsed ? parsed[2] : post.content;
  const displayName = await getAliasSafe(post.author); // <-- alias langsung dari contract
  const avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author}`;

  document.getElementById("postDetail").innerHTML = `
    <div class="glass glow rounded-xl p-4">
      <div class="flex gap-3 items-center mb-2">
        <img src="${avatar}" class="w-10 h-10 rounded-full">
        <div>
          <p class="text-sm font-mono text-purple-400">${displayName}</p>
          <p class="text-xs text-gray-500">${date}</p>
        </div>
      </div>
      <h2 class="font-semibold mb-1">${title}</h2>
      <p class="text-sm text-gray-300">${content}</p>
    </div>
  `;

  await loadComments(postIndex);

  const btnSend = document.getElementById("sendComment");
  btnSend.onclick = async () => {
    const input = document.getElementById("commentInput");
    const text = input.value.trim();
    if (!text) return;

    // ✅ Validasi konten dulu
    const error = validateContent(text);
    if (error) {
      alert(error);
      return;
    }

    try {
      const contractWithSigner = contract.connect(provider.getSigner());
      const tx = await contractWithSigner.commentPost(postIndex, text);
      await tx.wait();

      input.value = "";
      markCommented(postKey(post), activeWalletAddress);
      await loadComments(postIndex);
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim komentar. Pastikan wallet terhubung dan saldo cukup.");
    }
  };
}

window.addEventListener("load", initPost);
