document.addEventListener("DOMContentLoaded", () => {
    // GSAP animations
    gsap.from("#title", {
        opacity: 0,
        scale: 0.8,
        duration: 1,
        ease: "elastic.out(1, 0.5)",
    });

    // Navigation setup
    const navItems = document.querySelectorAll(".nav-item");
    const pages = document.querySelectorAll(".page");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const target = item.getAttribute("data-target");

            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            pages.forEach(page => {
                page.classList.toggle("active", page.id === target);
                if (page.id === target) {
                    gsap.fromTo(
                        page,
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
                    );
                }
            });
        });
    });

    document.querySelector(".nav-item").click();

    // User data initialization
    let userData = JSON.parse(localStorage.getItem("users")) || {};
    let currentUser = null;

    // DOM elements
    const loginBox = document.getElementById("login-box");
    const loginForm = document.getElementById("login-form");
    const loginMessage = document.getElementById("login-message");
    const coinCount = document.getElementById("coin-count");
    const collectionContainer = document.getElementById("collection-container");
    const shopContainer = document.getElementById("shop-container");
    const levelSelect = document.getElementById("level-select");
    const taskContainer = document.getElementById("task-container");
    const totalValue = document.getElementById("total-value");

    // تابع محاسبه قیمت دلاری NFT
    function calculateDollarPrice(coinPrice) {
        const exchangeRate = 1000; // نرخ تبدیل: 1000 سکه = 1 دلار
        return (coinPrice / exchangeRate).toFixed(2); // قیمت دلاری با دو رقم اعشار
    }

    // تابع محاسبه مجموع ارزش دلاری NFTهای کاربر
    function calculateTotalValue(collection) {
        const exchangeRate = 1000; // نرخ تبدیل: 1000 سکه = 1 دلار
        let total = 0;
        collection.forEach(nft => {
            const price = nft.number * (nft.name.includes("Rare") ? 500 : 5000); // قیمت بر اساس نوع NFT
            total += price / exchangeRate;
        });
        return total.toFixed(2);
    }

    // UI Update functions
    function updateUI() {
        if (currentUser) {
            const user = userData[currentUser];
            if (currentUser === "admin") {
                coinCount.textContent = "∞"; // نمایش سکه‌های نامحدود برای ادمین
                document.getElementById("coin-transfer-btn").style.display = "inline-block"; // نمایش دکمه انتقال سکه
            } else {
                coinCount.textContent = user.coins;
                document.getElementById("coin-transfer-btn").style.display = "none"; // مخفی کردن دکمه انتقال سکه
            }
            updateCollection();
        }
    }

    function updateCollection() {
        const user = userData[currentUser];
        collectionContainer.innerHTML = user.collection
            .map((nft, index) => `
                <div class="collection-item">
                    <img src="${nft.image}" alt="${nft.name} #${nft.number}">
                    <h4>${nft.name} #${nft.number}</h4>
                    <button class="transfer-btn" data-index="${index}" data-name="${nft.name}" data-number="${nft.number}">Transfer</button>
                </div>
            `)
            .join("");

        // Update total value
        totalValue.textContent = `$${calculateTotalValue(user.collection)}`;

        // Add event listeners to transfer buttons
        document.querySelectorAll(".transfer-btn").forEach(button => {
            button.addEventListener("click", () => openTransferModal(button));
        });
    }

    // Message display function
    function showMessage(title, text, type) {
        Swal.fire({
            title,
            text,
            icon: type,
            background: "#121212",
            color: "#eaeaea",
            confirmButtonColor: type === "success" ? "#00ffd1" : "#ff007a",
        });
    }

    // Wallet connection function
    const connectWalletButton = document.getElementById("connect-wallet-btn");

    async function connectVoltWallet() {
        try {
            // Check if Volt wallet is available
            if (window.volt) {
                console.log("Volt wallet detected");

                // Connect to Volt
                const provider = new ethers.providers.Web3Provider(window.volt);
                await provider.send("eth_requestAccounts", []); // Request account access
                const signer = provider.getSigner();
                const walletAddress = await signer.getAddress();

                // Display success message
                showMessage("Wallet Connected!", `Connected to Volt wallet at address: ${walletAddress}`, "success");
                console.log("Connected Wallet Address:", walletAddress);
            } else {
                // Volt wallet not found
                showMessage("Wallet Not Found", "Volt wallet is not detected. Please install Volt wallet.", "error");
            }
        } catch (error) {
            console.error("Error connecting to Volt wallet:", error);
            showMessage("Connection Error", "An error occurred while connecting to the wallet. Try again.", "error");
        }
    }

    if (connectWalletButton) {
        connectWalletButton.addEventListener("click", connectVoltWallet);
    }

    // NFT generation function
    function generateNFTs(level) {
        const levels = {
            rare: { name: "Rare NFTs", priceMultiplier: 500, start: 1, end: 10 }, // قیمت از 500 شروع می‌شود
            legendary: { name: "Legendary NFTs", priceMultiplier: 5000, start: 11, end: 20 }, // قیمت از 10000 شروع می‌شود
        };

        const { name, priceMultiplier, start, end } = levels[level];
        shopContainer.innerHTML = "";

        for (let i = start; i <= end; i++) {
            const price = i * priceMultiplier;
            const dollarPrice = calculateDollarPrice(price); // محاسبه قیمت دلاری

            const nftCard = document.createElement("div");
            nftCard.className = "nft-card";
            nftCard.innerHTML = `
                <img src="NFT-Collections/NFT${i}.png" alt="${name} #${i}">
                <h3>${name} #${i}</h3>
                <p>Price: <span class="price">${price}</span> Coins ($${dollarPrice})</p>
                <button class="buy-btn">Buy</button>
            `;

            const buyBtn = nftCard.querySelector(".buy-btn");
            const user = userData[currentUser];

            // Check if the NFT is already in the user's collection
            if (user && user.collection.some(nft => nft.name === name && nft.number === i)) {
                buyBtn.disabled = true;
                buyBtn.textContent = "Purchased";
            }

            buyBtn.addEventListener("click", () => {
                if (currentUser === "admin" || user.coins >= price) {
                    if (currentUser !== "admin") {
                        user.coins -= price;
                    }
                    user.collection.push({
                        name,
                        number: i,
                        image: nftCard.querySelector("img").src,
                    });
                    localStorage.setItem("users", JSON.stringify(userData));
                    updateUI();
                    showMessage("Purchase Successful!", `You bought ${name} #${i}.`, "success");
                    buyBtn.disabled = true;
                    buyBtn.textContent = "Purchased";
                } else {
                    showMessage("Not Enough Coins", "You need more coins to purchase this NFT.", "error");
                }
            });

            shopContainer.appendChild(nftCard);
        }
    }

    // Level change event listener
    levelSelect.addEventListener("change", e => {
        generateNFTs(e.target.value);
    });

    // Task initialization
    function initializeTasks() {
        if (!currentUser) return; // Ensure a user is logged in
        const user = userData[currentUser];

        // Default structure for new users
        if (!user.completedTasks) user.completedTasks = [];
        if (!user.lastCompletionDate) user.lastCompletionDate = null;

        const tasks = taskContainer.querySelectorAll(".task-item");

        const currentTime = new Date();
        const resetTime = new Date();
        resetTime.setHours(4, 0, 0, 0); // Reset at 4:00 a.m.

        // Check if tasks need to be reset
        const lastCompletionDate = user.lastCompletionDate ? new Date(user.lastCompletionDate) : null;

        if (!lastCompletionDate || (currentTime > resetTime && lastCompletionDate.toDateString() !== currentTime.toDateString())) {
            user.completedTasks = []; // Reset completed tasks
            user.lastCompletionDate = currentTime.toISOString(); // Update last completion date
            localStorage.setItem("users", JSON.stringify(userData));
        }

        // Set up task buttons
        tasks.forEach((task, index) => {
            const coins = parseInt(task.getAttribute("data-coins"));
            const button = task.querySelector(".complete-task-btn");

            // Disable button if the task is already completed
            if (user.completedTasks.includes(index)) {
                button.disabled = true;
                button.textContent = "Completed";
                button.style.background = "#333";
                button.style.color = "#777";
            } else {
                button.disabled = false;
                button.textContent = "Complete Task";
                button.style.background = "";
                button.style.color = "";
            }

            // Button click event
            button.addEventListener("click", () => {
                if (!user.completedTasks.includes(index)) {
                    user.coins += coins;
                    user.completedTasks.push(index);

                    // Save data to localStorage
                    localStorage.setItem("users", JSON.stringify(userData));

                    updateUI();
                    showMessage("Task Completed!", `You earned ${coins} coins!`, "success");

                    // Update button UI
                    button.disabled = true;
                    button.textContent = "Completed";
                    button.style.background = "#333";
                    button.style.color = "#777";
                } else {
                    showMessage("Task Already Completed", "Wait until 4:00 a.m. to complete tasks again.", "warning");
                }
            });
        });
    }

    // Login form handling
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if (userData[username]) {
            if (userData[username].password === password) {
                currentUser = username;
                loginMessage.style.color = "#00ffd1";
                loginMessage.textContent = "Login successful!";
                setTimeout(() => {
                    loginBox.style.display = "none";
                    updateUI();
                    initializeTasks(); // Initialize tasks for the current user
                }, 1000);
            } else {
                loginMessage.style.color = "#ff007a";
                loginMessage.textContent = "Incorrect password!";
            }
        } else {
            userData[username] = {
                password,
                coins: 50,
                collection: [],
                completedTasks: [],
                lastCompletionDate: null,
                lastGameDate: null, // Add last game date for the new user
            };
            currentUser = username;
            localStorage.setItem("users", JSON.stringify(userData));
            loginMessage.style.color = "#00ffd1";
            loginMessage.textContent = "Account created successfully!";
            setTimeout(() => {
                loginBox.style.display = "none";
                updateUI();
                initializeTasks(); // Initialize tasks for the new user
            }, 1000);
        }
    });

    // Transfer NFT functionality
    function openTransferModal(button) {
        const nftName = button.getAttribute("data-name");
        const nftNumber = button.getAttribute("data-number");
        const nftIndex = button.getAttribute("data-index");

        document.getElementById("transfer-nft-info").textContent = `Transferring ${nftName} #${nftNumber}`;
        document.getElementById("transfer-modal").style.display = "flex";

        document.getElementById("confirm-transfer-btn").onclick = () => {
            const recipientUsername = document.getElementById("recipient-username").value.trim();
            handleNFTTransfer(nftIndex, recipientUsername);
        };

        document.getElementById("cancel-transfer-btn").onclick = () => {
            document.getElementById("transfer-modal").style.display = "none";
        };
    }

    function handleNFTTransfer(nftIndex, recipientUsername) {
        const user = userData[currentUser];
        const recipient = userData[recipientUsername];

        if (!recipient) {
            showMessage("User Not Found", "The recipient username does not exist.", "error");
            return;
        }

        const nftToTransfer = user.collection[nftIndex];
        if (recipient.collection.some(nft => nft.name === nftToTransfer.name && nft.number === nftToTransfer.number)) {
            showMessage("Duplicate NFT", "The recipient already owns this NFT.", "error");
            return;
        }

        // Transfer NFT
        recipient.collection.push(nftToTransfer);
        user.collection.splice(nftIndex, 1);
        localStorage.setItem("users", JSON.stringify(userData));

        // Update UI and close modal
        updateUI();
        document.getElementById("transfer-modal").style.display = "none";
        showMessage("Transfer Successful", `You have transferred ${nftToTransfer.name} #${nftToTransfer.number} to ${recipientUsername}.`, "success");
    }

    // Game Logic (Coin Miner)
    const gameArea = document.getElementById("game-area");
    const timeLeftDisplay = document.getElementById("time-left");
    const scoreDisplay = document.getElementById("score");
    const startGameBtn = document.getElementById("start-game-btn");

    let timeLeft = 30;
    let score = 0;
    let gameInterval;
    let coinInterval;
    let isGameActive = false;

    // Function to create a falling coin
    function createCoin() {
        const coin = document.createElement("div");
        coin.className = "falling-coin";
        coin.style.left = `${Math.random() * (gameArea.offsetWidth - 40)}px`;
        coin.style.top = "0";
        gameArea.appendChild(coin);

        // Move the coin down
        const fallInterval = setInterval(() => {
            const currentTop = parseFloat(coin.style.top);
            if (currentTop >= gameArea.offsetHeight - 40) {
                clearInterval(fallInterval);
                coin.remove();
            } else {
                coin.style.top = `${currentTop + 5}px`;
            }
        }, 50);

        // Collect coin on click
        coin.addEventListener("click", () => {
            score++;
            scoreDisplay.textContent = score;
            coin.remove();
        });
    }

    // Function to start the game
    function startGame() {
        if (isGameActive) return; // Prevent multiple starts
        isGameActive = true;

        timeLeft = 30;
        score = 0;
        timeLeftDisplay.textContent = timeLeft;
        scoreDisplay.textContent = score;
        startGameBtn.disabled = true;

        // Clear existing coins
        gameArea.innerHTML = '';

        // Timer
        gameInterval = setInterval(() => {
            timeLeft--;
            timeLeftDisplay.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(gameInterval);
                clearInterval(coinInterval);
                isGameActive = false;
                endGame();
            }
        }, 1000);

        // Create coins every 0.5 seconds
        coinInterval = setInterval(createCoin, 500);
    }

    // Function to end the game
    function endGame() {
        if (currentUser) {
            const user = userData[currentUser];
            user.coins += score; // Add score to user's coins
            user.lastGameDate = new Date().toISOString(); // Save last game date
            localStorage.setItem("users", JSON.stringify(userData));
            updateUI();
            showMessage("Game Over!", `You collected ${score} coins!`, "info");
        }
        startGameBtn.disabled = false;
    }
    
    // Check if the game can be played today
    function checkGameAvailability() {
        if (currentUser) {
            const user = userData[currentUser];
            const currentTime = new Date();
            const resetTime = new Date();
            resetTime.setHours(4, 0, 0, 0); // Reset at 4:00 a.m.

            if (user.lastGameDate) {
                const lastGameDate = new Date(user.lastGameDate);
                if (currentTime > resetTime && lastGameDate.toDateString() !== currentTime.toDateString()) {
                    user.lastGameDate = null; // Reset if it's a new day
                    localStorage.setItem("users", JSON.stringify(userData)); // Save reset
                }
            }

            if (user.lastGameDate) {
                startGameBtn.disabled = true;
                startGameBtn.textContent = "Come Back Tomorrow!";
            } else {
                startGameBtn.disabled = false;
                startGameBtn.textContent = "Start Game";
            }
        }
    }

    // Update game availability on page load
    checkGameAvailability();

    // Event listener for the start game button
    startGameBtn.addEventListener("click", startGame);

    // Initialize UI
    generateNFTs("rare");
    initializeTasks();

    // ================================================
    // اضافه کردن قابلیت انتقال سکه برای کاربر admin
    // ================================================

    // Transfer Coins functionality for admin
    function openCoinTransferModal() {
        if (currentUser === "admin") {
            document.getElementById("coin-transfer-modal").style.display = "flex";

            document.getElementById("confirm-coin-transfer-btn").onclick = () => {
                const recipientUsername = document.getElementById("coin-recipient-username").value.trim();
                const amount = parseInt(document.getElementById("coin-amount").value.trim());

                if (!recipientUsername || isNaN(amount) || amount <= 0) {
                    showMessage("Invalid Input", "Please enter a valid username and amount.", "error");
                    return;
                }

                handleCoinTransfer(recipientUsername, amount);
            };

            document.getElementById("cancel-coin-transfer-btn").onclick = () => {
                document.getElementById("coin-transfer-modal").style.display = "none";
            };
        } else {
            showMessage("Access Denied", "Only admin can transfer coins.", "error");
        }
    }

    function handleCoinTransfer(recipientUsername, amount) {
        const recipient = userData[recipientUsername];

        if (!recipient) {
            showMessage("User Not Found", "The recipient username does not exist.", "error");
            return;
        }

        // Admin has unlimited coins, so no need to check balance
        recipient.coins += amount;
        localStorage.setItem("users", JSON.stringify(userData));

        // Update UI and close modal
        document.getElementById("coin-transfer-modal").style.display = "none";
        showMessage("Transfer Successful", `You have transferred ${amount} coins to ${recipientUsername}.`, "success");
    }

    // Add event listener for the coin transfer button
    const coinTransferButton = document.getElementById("coin-transfer-btn");
    if (coinTransferButton) {
        coinTransferButton.addEventListener("click", openCoinTransferModal);
    }
});
