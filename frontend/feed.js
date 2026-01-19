import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const contractAddress = "0x2b81C9107d72ad64D753F3B7633375698d30b61f";

const abi = [
  "function getPosts() public view returns (tuple(address author, string content, uint256 timestamp, uint256 likeCount, uint256 dislikeCount)[])",
  "function likePost(uint256 postId) public",
  "function dislikePost(uint256 postId) public",
  "function commentPost(uint256 postId, string text) public",
  "function getComments(uint256 postId) public view returns (tuple(address commenter, string text, uint256 timestamp)[])",
  "function getAlias(address user) public view returns (string memory)"
];

let provider;
let contract;
let activeWalletAddress = "";

function getAlias(address) {
  return localStorage.getItem(`alias_${address.toLowerCase()}`);
}

const get = (k) => localStorage.getItem(k);
const set = (k, v) => localStorage.setItem(k, v);

const aliasCache = {};

async function getAliasSafe(address) {
  address = address.toLowerCase();
  if (aliasCache[address]) return aliasCache[address]; // pakai cache kalau ada
  try {
    const a = await contract.getAlias(address);
    const alias = a && a.length > 0 ? a : `${address.slice(0,6)}...${address.slice(-4)}`;
    aliasCache[address] = alias; // simpan ke cache
    return alias;
  } catch(err) {
    console.error("Gagal ambil alias:", err);
    const fallback = `${address.slice(0,6)}...${address.slice(-4)}`;
    aliasCache[address] = fallback;
    return fallback;
  }
}

function postKey(msg) {
  return msg.author + "_" + msg.timestamp.toString();
}

async function renderActiveAccount(address) {
  activeWalletAddress = address;

  const el = document.getElementById("activeAddress");
  const alias = await getAliasSafe(address);

  el.innerText = alias;
  el.classList.add("font-mono", "text-purple-400");
  el.title = "Wallet alias";

  document.getElementById("activeAvatar").src =
    `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`;
}

async function initFeed() {
  if (!window.ethereum) {
    alert("MetaMask tidak ditemukan");
    return;
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });

  provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = (await signer.getAddress()).toLowerCase();

  const savedWallet = localStorage.getItem("wallet");
  if (savedWallet && savedWallet.toLowerCase() !== address.toLowerCase()) {
    logoutWallet("Wallet aktif berbeda dengan wallet login");
    return;
  }

  contract = new ethers.Contract(contractAddress, abi, provider);

  // Render alias aktif **langsung dari blockchain**
  await renderActiveAccount(address);

  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    alert("Gunakan Sepolia Testnet");
    return;
  }

  await loadFeed(); // load feed setelah alias siap
}


async function hasCommented(pid) {
  if (!activeWalletAddress) return false;

  const comments = await contract.getComments(pid);
  return comments.some(c => c.commenter.toLowerCase() === activeWalletAddress.toLowerCase());
}


async function loadFeed() {
  const feed = document.getElementById("feedList");
  const scrollY = window.scrollY;
  feed.innerHTML = "";

  const postsData = await contract.getPosts();
  const posts = [...postsData].reverse();

  if (!posts.length) {
    feed.innerHTML = `<p class="text-center text-gray-500 mt-10">
      Belum ada post di blockchain
    </p>`;
    return;
  }

  // Ambil semua alias sekaligus (parallel)
  const allAliases = await Promise.all(posts.map(p => getAliasSafe(p.author)));

  for (let index = 0; index < posts.length; index++) {
    const msg = posts[index];
    const pid = postsData.length - 1 - index;
    const alias = allAliases[index]; // alias sudah siap
    const shortUser = alias;

    const likes = msg.likeCount;
    const dislikes = msg.dislikeCount;
    const voted = get("voted_" + pid);

    const comments = await contract.getComments(pid);
    const commentCount = comments.length;

    const date = new Date(Number(msg.timestamp) * 1000).toLocaleString("id-ID");
    const parsed = msg.content.match(/^\[(.*?)\]\s*(.*)/);
    const title = parsed ? parsed[1] : "Immutable Post";
    const content = parsed ? parsed[2] : msg.content;

    const avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${msg.author}`;
    const commented = await hasCommented(pid);

    const post = document.createElement("div");
    post.className = "glass glow rounded-xl mb-6 overflow-hidden";
    post.innerHTML = `
      <div class="flex items-center px-4 py-3 gap-3">
        <img src="${avatar}" class="w-10 h-10 rounded-full">
        <div class="flex-1">
          <p class="text-sm font-mono text-purple-400 flex items-center gap-2">
            ${shortUser}
          </p>
          <p class="text-xs text-gray-400">${date}</p>
        </div>
        <span class="text-[10px] px-2 py-1 rounded-full bg-purple-600 text-black font-bold">
          IMMUTABLE
        </span>
      </div>

      <div class="px-4 pb-2">
        <h2 class="font-semibold mb-1">${title}</h2>
        <p class="text-gray-300 text-sm">${content}</p>
      </div>

      <div class="flex justify-between px-4 py-3 text-xl text-gray-400">
        <button class="like-btn flex items-center gap-1" data-pid="${pid}" data-index="${index}">
          <i class="${voted === "like" ? "fas fa-heart text-red-500" : "far fa-heart"}"></i>
          <span class="text-sm">${likes}</span>
        </button>

        <button class="dislike-btn flex items-center gap-1" data-pid="${pid}" data-index="${index}">
          <i class="${voted === "dislike" ? "fas fa-thumbs-down text-blue-500" : "far fa-thumbs-down"}"></i>
          <span class="text-sm">${dislikes}</span>
        </button>

        <button class="comment-btn flex items-center gap-1 ${commented ? 'text-green-400' : ''}" data-pid="${pid}" data-index="${index}">
          <i class="far fa-comment"></i>
          <span class="text-sm">${commentCount}</span>
        </button>

        <button class="share-btn" data-text="${content}">
          <i class="far fa-paper-plane"></i>
        </button>
      </div>

      <div class="px-4 pb-3 text-xs text-gray-500 font-mono">
        Stored permanently on Sepolia Blockchain
      </div>
    `;

    feed.appendChild(post);
  }

  bindActions();
  requestAnimationFrame(() => window.scrollTo(0, scrollY));
}


function bindActions() {
  document.querySelectorAll(".like-btn").forEach(btn => {
    btn.onclick = async () => {
      const pid = parseInt(btn.dataset.pid); // gunakan pid asli
      try {
        const signer = await provider.getSigner();
        const contractWithSigner = contract.connect(signer);
        const tx = await contractWithSigner.likePost(pid); // ✅ pid asli
        await tx.wait();

        set("voted_" + pid, "like"); // simpan status voted
        await loadFeed(); // reload feed supaya angka & warna update
      } catch (err) {
        console.error(err);
        alert("Transaksi gagal, pastikan wallet terhubung dan ada saldo ETH Sepolia");
      }
    };
  });

  document.querySelectorAll(".dislike-btn").forEach(btn => {
    btn.onclick = async () => {
      const pid = parseInt(btn.dataset.pid);
      try {
        const signer = await provider.getSigner();
        const contractWithSigner = contract.connect(signer);
        const tx = await contractWithSigner.dislikePost(pid); // ✅ pid asli
        await tx.wait();

        set("voted_" + pid, "dislike");
        await loadFeed(); // reload feed supaya angka & warna update
      } catch (err) {
        console.error(err);
        alert("Transaksi gagal, pastikan wallet terhubung dan ada saldo ETH Sepolia");
      }
    };
  });


  document.querySelectorAll(".comment-btn").forEach(btn => {
    btn.onclick = () => {
      const pid = btn.dataset.pid;
      window.location.href = `post.html?postId=${pid}`; // pakai pid asli
    };
  });


  document.querySelectorAll(".share-btn").forEach(btn => {
    btn.onclick = () => {
      navigator.clipboard.writeText(btn.dataset.text);
      alert("Isi post berhasil disalin");
    };
  });
}

if (window.ethereum) {
  window.ethereum.on("accountsChanged", (accounts) => {
    if (!accounts || accounts.length === 0) {
      logoutWallet("Wallet terputus dari MetaMask");
      return;
    }

    const newAccount = accounts[0].toLowerCase();
    const savedWallet = localStorage.getItem("wallet");

    if (savedWallet && newAccount !== savedWallet.toLowerCase()) {
      logoutWallet("Akun MetaMask diganti");
    }
  });
}

function logoutWallet(message) {
  console.log("🚪 Logout wallet:", message);
  localStorage.removeItem("wallet");

  const modal = document.getElementById("logoutModal");
  const msg = document.getElementById("logoutMessage");
  const btn = document.getElementById("logoutConfirmBtn");

  if (!modal || !msg || !btn) {
    alert(message + "\n\nSilakan hubungkan wallet kembali.");
    window.location.href = "connect.html";
    return;
  }

  msg.innerText = message + "\n\nSilakan hubungkan wallet kembali.";
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  btn.onclick = () => {
    window.location.href = "connect.html";
  };
}

window.addEventListener("load", initFeed);
