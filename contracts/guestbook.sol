// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Guestbook {
    // Struktur data pesan
    struct Message {
        address sender;
        string text;
        uint256 timestamp;
    }

    // Array untuk menyimpan semua pesan (Abadi)
    Message[] public messages;

    // Fungsi untuk menulis ke blockchain
    function postMessage(string memory _text) public {
        messages.push(Message(msg.sender, _text, block.timestamp));
    }

    // Fungsi untuk mengambil semua pesan
    function getMessages() public view returns (Message[] memory) {
        return messages;
    }
}
