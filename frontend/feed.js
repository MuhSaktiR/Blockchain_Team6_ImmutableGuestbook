import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const contractAddress = "0xBD87961C2f8E3908e59A04019A33376FB465c2a0";
const abi = [
  "function getMessages() public view returns (tuple(address sender, string text, uint256 timestamp)[])"
];

let provider;
let contract;
let activeWalletAddress = "";

// ===============================
// LOCAL STORAGE UTIL
// ===============================
const get = (k) => localStorage.getItem(k);
const set = (k, v) => localStorage.setItem(k, v);

function postKey(msg) {
  return msg.sender + "_" + msg.timestamp.toString();
}
// ===============================
// ACTIVE ACCOUNT (COPYABLE)
// ===============================
function renderActiveAccount(address) {
  activeWalletAddress = address;
  const el = document.getElementById("activeAddress");
  const short = address.slice(0, 6) + "..." + address.slice(-4);

  el.innerText = short;
  el.style.cursor = "default";
  el.title = "Wallet address tidak dapat dicopy";

  document.getElementById("activeAvatar").src =
    `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`;

  el.onclick = null;
}

// ===============================
// INIT
// ===============================
async function initFeed() {
  if (!window.ethereum) {
    alert("MetaMask tidak ditemukan");
    return;
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });

  provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  renderActiveAccount(address);

  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    alert("Gunakan Sepolia Testnet");
    return;
  }

  contract = new ethers.Contract(contractAddress, abi, provider);
  loadFeed();
}

// ===============================
// LOAD FEED
// ===============================
async function loadFeed() {
  const feed = document.getElementById("feedList");
  const scrollY = window.scrollY;

  feed.innerHTML = "";

  const messages = await contract.getMessages();
  const posts = [...messages].reverse();

  if (!posts.length) {
    feed.innerHTML = `<p class="text-center text-gray-500 mt-10">
      Belum ada post di blockchain
    </p>`;
    return;
  }

  posts.forEach((msg) => {
  const pid = postKey(msg);


    const likes = parseInt(get("likes_" + pid) || "0");
    const dislikes = parseInt(get("dislikes_" + pid) || "0");
    const voted = get("voted_" + pid);

    const date = new Date(Number(msg.timestamp) * 1000).toLocaleString("id-ID");
    const parsed = msg.text.match(/^\[(.*?)\]\s*(.*)/);
    const title = parsed ? parsed[1] : "Immutable Post";
    const content = parsed ? parsed[2] : msg.text;

    const shortUser = msg.sender.slice(0, 6) + "..." + msg.sender.slice(-4);
    const avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${msg.sender}`;

    const post = document.createElement("div");
    post.className = "glass glow rounded-xl mb-6 overflow-hidden";

    post.innerHTML = `
      <div class="flex items-center px-4 py-3 gap-3">
        <img src="${avatar}" class="w-10 h-10 rounded-full">
        <div class="flex-1">
          <p class="text-sm font-mono text-purple-400 select-none">
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
        <button class="like-btn flex items-center gap-1" data-id="${pid}">
          <i class="${voted === "like"
            ? "fas fa-heart text-pink-500"
            : "far fa-heart"}"></i>
          <span class="text-sm">${likes}</span>
        </button>

        <button class="dislike-btn flex items-center gap-1" data-id="${pid}">
          <i class="${voted === "dislike"
            ? "fas fa-thumbs-down text-blue-400"
            : "far fa-thumbs-down"}"></i>
          <span class="text-sm">${dislikes}</span>
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
  });

  bindActions();

  requestAnimationFrame(() => window.scrollTo(0, scrollY));
}

// ===============================
// ACTIONS (LIKE / DISLIKE TOGGLE)
// ===============================
function bindActions() {

  document.querySelectorAll(".like-btn").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const voted = get("voted_" + id);

      if (voted === "like") {
        set("likes_" + id, Math.max(0, get("likes_" + id) - 1));
        localStorage.removeItem("voted_" + id);
      } else {
        set("likes_" + id, parseInt(get("likes_" + id) || 0) + 1);
        if (voted === "dislike") {
          set("dislikes_" + id, Math.max(0, get("dislikes_" + id) - 1));
        }
        set("voted_" + id, "like");
      }
      loadFeed();
    };
  });

  document.querySelectorAll(".dislike-btn").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const voted = get("voted_" + id);

      if (voted === "dislike") {
        set("dislikes_" + id, Math.max(0, get("dislikes_" + id) - 1));
        localStorage.removeItem("voted_" + id);
      } else {
        set("dislikes_" + id, parseInt(get("dislikes_" + id) || 0) + 1);
        if (voted === "like") {
          set("likes_" + id, Math.max(0, get("likes_" + id) - 1));
        }
        set("voted_" + id, "dislike");
      }
      loadFeed();
    };
  });

  document.querySelectorAll(".share-btn").forEach(btn => {
    btn.onclick = () => {
      navigator.clipboard.writeText(btn.dataset.text);
      alert("Isi post berhasil disalin");
    };
  });

  document.querySelectorAll(".copy-user").forEach(el => {
    el.onclick = async () => {
      await navigator.clipboard.writeText(el.dataset.address);
      const old = el.innerText;
      el.innerText = "Copied!";
      el.classList.add("text-green-400");
      setTimeout(() => {
        el.innerText = old;
        el.classList.remove("text-green-400");
      }, 1000);
    };
  });
}

window.addEventListener("load", initFeed);
