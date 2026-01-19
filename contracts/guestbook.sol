// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Guestbook {

    struct Post {
        address author;
        string content;
        uint256 timestamp;
        uint256 likeCount;
        uint256 dislikeCount;
    }

    struct Comment {
        address commenter;
        string text;
        uint256 timestamp;
    }

    Post[] public posts;

    mapping(uint256 => mapping(address => bool)) public liked;
    mapping(uint256 => mapping(address => bool)) public disliked;

    mapping(uint256 => Comment[]) private comments;

    mapping(address => string) private aliases;
    mapping(address => bool) private aliasSet;

    function postMessage(string calldata _content) external {
        require(aliasSet[msg.sender], "Alias not set");
        posts.push(Post({
            author: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            likeCount: 0,
            dislikeCount: 0
        }));
    }

    function likePost(uint256 postId) external {
        require(postId < posts.length, "Post not found");
        require(!liked[postId][msg.sender], "Already liked");

        if (disliked[postId][msg.sender]) {
            disliked[postId][msg.sender] = false;
            posts[postId].dislikeCount--;
        }

        liked[postId][msg.sender] = true;
        posts[postId].likeCount++;
    }

    function dislikePost(uint256 postId) external {
        require(postId < posts.length, "Post not found");
        require(!disliked[postId][msg.sender], "Already disliked");

        if (liked[postId][msg.sender]) {
            liked[postId][msg.sender] = false;
            posts[postId].likeCount--;
        }

        disliked[postId][msg.sender] = true;
        posts[postId].dislikeCount++;
    }

    function commentPost(uint256 postId, string calldata text) external {
        require(postId < posts.length, "Post not found");
        require(aliasSet[msg.sender], "Alias not set");

        comments[postId].push(Comment({
            commenter: msg.sender,
            text: text,
            timestamp: block.timestamp
        }));
    }

    function getPosts() external view returns (Post[] memory) {
        return posts;
    }

    function getComments(uint256 postId) external view returns (Comment[] memory) {
        return comments[postId];
    }

    function setAlias(string calldata _alias) external {
        require(!aliasSet[msg.sender], "Alias already set");
        require(bytes(_alias).length >= 3, "Alias too short");

        aliases[msg.sender] = _alias;
        aliasSet[msg.sender] = true;
    }

    function getAlias(address user) external view returns (string memory) {
        return aliases[user];
    }

    function hasAlias(address user) external view returns (bool) {
        return aliasSet[user];
    }
}
