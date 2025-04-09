document.addEventListener("DOMContentLoaded", function() {
    const searchButton = document.getElementById("search-btn");
    const usernameInput = document.getElementById("user-input");
    const statsContainer = document.querySelector(".stats-container");
    const easyLabel = document.getElementById("easy-lable");
    const mediumLabel = document.getElementById("medium-lable");
    const hardLabel = document.getElementById("hard-lable");
    const cardStatsContainer = document.querySelector(".stats-cards");

    // Alternative API endpoints (we'll try them in order)
    const API_ENDPOINTS = [
        `https://leetcode-stats-api.herokuapp.com`,  // Most reliable alternative
        `https://leetcodestats.cyclic.app`,         // Secondary option
        `https://leetcode-api-faisalshohag.vercel.app`  // Tertiary option
    ];

    function validateUsername(username) {
        if (username.trim() === "") {
            alert("Username should not be empty!!");
            return false;
        }
        const regex = /^[a-zA-Z0-9_-]{1,15}$/;
        const isMatching = regex.test(username);
        if (!isMatching) {
            alert("Invalid Username!!");
        }
        return isMatching;
    }

    async function fetchWithFallback(username, endpoints) {
        for (const endpoint of endpoints) {
            try {
                const url = `${endpoint}/${username}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                const data = await response.json();
                return data;
            } catch (error) {
                console.log(`Attempt failed with ${endpoint}:`, error);
                // Try next endpoint
            }
        }
        throw new Error("All API endpoints failed");
    }

    async function fetchUserDetails(username) {
        try {
            searchButton.textContent = "Searching...";
            searchButton.disabled = true;
            
            const data = await fetchWithFallback(username, API_ENDPOINTS);
            
            // Different APIs return different structures - normalize them
            const normalizedData = normalizeData(data);
            
            updateProgressCircles(normalizedData);
            updateStatsCards(normalizedData);
            
        } catch (error) {
            console.error("Error:", error);
            showError(`Failed to fetch data: ${error.message}`);
        } finally {
            searchButton.textContent = "Search";
            searchButton.disabled = false;
        }
    }

    function normalizeData(data) {
        // Handle different API response structures
        if (data.totalSolved !== undefined) {
            // First API format
            return {
                easySolved: data.easySolved,
                mediumSolved: data.mediumSolved,
                hardSolved: data.hardSolved,
                totalEasy: data.totalEasy,
                totalMedium: data.totalMedium,
                totalHard: data.totalHard,
                totalSolved: data.totalSolved,
                ranking: data.ranking,
                acceptanceRate: Math.round(data.acceptanceRate * 100) / 100,
                contributionPoints: data.contributionPoints || 0
            };
        } else if (data.data && data.data.matchedUser) {
            // Second API format
            const stats = data.data.matchedUser.submitStats.acSubmissionNum;
            return {
                easySolved: stats.find(s => s.difficulty === "Easy").count,
                mediumSolved: stats.find(s => s.difficulty === "Medium").count,
                hardSolved: stats.find(s => s.difficulty === "Hard").count,
                totalSolved: stats.reduce((sum, s) => sum + s.count, 0),
                ranking: data.data.matchedUser.profile.ranking,
                acceptanceRate: Math.round(data.data.matchedUser.profile.acceptanceRate * 100) / 100
            };
        }
        return data; // fallback
    }

    function updateProgressCircles(data) {
        const { easySolved, mediumSolved, hardSolved, totalEasy = 700, totalMedium = 700, totalHard = 700 } = data;
        
        // Calculate percentages (with defaults if totals aren't available)
        const easyPercent = Math.round((easySolved / totalEasy) * 100);
        const mediumPercent = Math.round((mediumSolved / totalMedium) * 100);
        const hardPercent = Math.round((hardSolved / totalHard) * 100);
        
        // Update labels
        easyLabel.textContent = `${easySolved}/${totalEasy} `;
        mediumLabel.textContent = `${mediumSolved}/${totalMedium} `;
        hardLabel.textContent = `${hardSolved}/${totalHard} `;
        
        // Update progress circles
        document.querySelector(".easy-progress").style.setProperty('--progress-degree', `${easyPercent * 3.6}deg`);
        document.querySelector(".medium-progress").style.setProperty('--progress-degree', `${mediumPercent * 3.6}deg`);
        document.querySelector(".hard-progress").style.setProperty('--progress-degree', `${hardPercent * 3.6}deg`);
    }

    function updateStatsCards(data) {
        const { totalSolved, ranking = "N/A", acceptanceRate = "N/A", contributionPoints = 0 } = data;
        
        cardStatsContainer.innerHTML = `
            <div class="stats-card">
                <h3>Total Solved</h3>
                <p>${totalSolved}</p>
            </div>
            <div class="stats-card">
                <h3>Ranking</h3>
                <p>${ranking}</p>
            </div>
            <div class="stats-card">
                <h3>Acceptance Rate</h3>
                <p>${acceptanceRate}%</p>
            </div>
            <div class="stats-card">
                <h3>Contribution</h3>
                <p>${contributionPoints}</p>
            </div>
        `;
    }

    function showError(message) {
        statsContainer.innerHTML = `
            <div class="error">
                <p>${message}</p>
                <p>Try a different username or check back later.</p>
            </div>
        `;
    }

    searchButton.addEventListener('click', function() {
        const username = usernameInput.value;
        if (validateUsername(username)) {
            fetchUserDetails(username);
        }
    });

    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const username = usernameInput.value;
            if (validateUsername(username)) {
                fetchUserDetails(username);
            }
        }
    });
});