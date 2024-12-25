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
    const timerElements = {
        days: document.getElementById('days'),
        hours: document.getElementById('hours'),
        minutes: document.getElementById('minutes'),
        seconds: document.getElementById('seconds')
    };

    // UI Update functions
    function updateUI() {
        if (currentUser) {
            const user = userData[currentUser];
            coinCount.textContent = user.coins;
            updateCollection();
        }
    }

    function updateCollection() {
        const user = userData[currentUser];
        collectionContainer.innerHTML = user.collection
            .map(nft => `<div class="collection-item">
                            <img src="${nft.image}" alt="${nft.name} #${nft.number}">
                            <h4>${nft.name} #${nft.number}</h4>
                        </div>`)
            .join("");
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
    document.addEventListener("DOMContentLoaded", () => {
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
    
        // Event listener for the connect button
        connectWalletButton.addEventListener("click", connectVoltWallet);
    
        // Reusable function to show messages
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
    });
    

    // NFT generation function
    function generateNFTs(level) {
        const levels = {
            rare: { name: "Rare NFTs", priceMultiplier: 50, start: 1, end: 10 },
            legendary: { name: "Legendary NFTs", priceMultiplier: 100, start: 11, end: 20 },
        };

        const { name, priceMultiplier, start, end } = levels[level];
        shopContainer.innerHTML = "";

        for (let i = start; i <= end; i++) {
            const price = i * priceMultiplier;

            const nftCard = document.createElement("div");
            nftCard.className = "nft-card";
            nftCard.innerHTML = `
                <img src="NFT-Collections/NFT${i}.png" alt="${name} #${i}">
                <h3>${name} #${i}</h3>
                <p>Price: <span class="price">${price}</span> Coins</p>
                <button class="buy-btn">Buy</button>
            `;

            const buyBtn = nftCard.querySelector(".buy-btn");
            buyBtn.addEventListener("click", () => {
                const user = userData[currentUser];
                if (user.coins >= price) {
                    user.coins -= price;
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


    // Timer setup
    let days = 20, hours = 23, minutes = 59, seconds = 59;
    // Timer update function
    const updateTimer = () => {
        if (seconds > 0) {
            seconds--;
        } else if (minutes > 0) {
            minutes--;
            seconds = 59;
        } else if (hours > 0) {
            hours--;
            minutes = 59;
            seconds = 59;
        } else if (days > 0) {
            days--;
            hours = 23;
            minutes = 59;
            seconds = 59;
        } else {
            clearInterval(timerInterval);
            alert("Time's up!");
        }

        // Update values in DOM
        timerElements.days.textContent = days;
        timerElements.hours.textContent = String(hours).padStart(2, '0');
        timerElements.minutes.textContent = String(minutes).padStart(2, '0');
        timerElements.seconds.textContent = String(seconds).padStart(2, '0');
    };

        // Call updateTimer every second
    const timerInterval = setInterval(updateTimer, 1000);

updateTimer();


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

    function handleCheckbox(button, url) {
    // انتقال به لینک تلگرام
    window.open(url, '_blank');

    // افزودن کوین‌ها پس از انجام
    setTimeout(() => {
        const user = userData[currentUser];
        const coins = parseInt(button.closest('.task-item').dataset.coins);
        user.coins += coins;
        localStorage.setItem("users", JSON.stringify(userData));
        updateUI();
        showMessage("Task Completed!", `You earned ${coins} coins for joining our Telegram channel.`, "success");

        // غیرفعال کردن دکمه
        button.disabled = true;
        button.textContent = "Completed";
    }, 5000); // تأخیر ۵ ثانیه‌ای برای اطمینان از انجام تسک
}

    // Initialize UI
    generateNFTs("rare");
    initializeTasks();
});

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

    // Add event listeners to transfer buttons
    document.querySelectorAll(".transfer-btn").forEach(button => {
        button.addEventListener("click", () => openTransferModal(button));
    });
}

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

