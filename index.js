const puppeteer = require('puppeteer');

const roomTeams = "3";
const totalUserCount = 1;

async function launchChromeAndRunPuppeteer() {
	try {
		// Use dynamic import for 'chrome-launcher'
		const { launch, killAll } = await import('chrome-launcher');

		await killAll();
		// Launch Chrome with remote debugging enabled
		const chrome = await launch({});

		console.log(`Chrome debugging port running on ${chrome.port}`);

		// Connect Puppeteer to the launched Chrome instance
		const browser = await puppeteer.connect({
			browserURL: `http://localhost:${chrome.port}`,
			defaultViewport: null,
		});

		async function playAgain(page, sequence) {
			while (true) {
				const gameEnded = await page.$eval('#gameOver', element => element?.style?.display);
				if (gameEnded === "block") break;

				// Add a delay between checks to avoid constant polling and reduce CPU usage
				await page.waitForTimeout(3 * 1000); // Adjust the delay as needed
			}

			await page.waitForTimeout(10 * 1000);
			await page.click('#playAgain');

			await page.waitForTimeout(3 * 1000);
			playAgain(page, sequence)
			console.log(`user ${sequence} restarted.`)
		}

		async function openNewPage(sequence) {
			try {
				// Perform tasks using Puppeteer
				const page = await browser.newPage();
				await page.goto('https://aquar.io', { timeout: 200 * 1000 });
				// await page.setDefaultNavigationTimeout(60 * 1000); // Set timeout to 60 seconds
				// await page.waitForNavigation({ timeout: 60 * 1000 }); // Wait for navigation to complete (60 seconds timeout)

				await page.waitForTimeout(1000);

				const inputSelector = "#name";
				await page.waitForSelector(inputSelector);
				await page.$eval(inputSelector, input => input.value = '');
				await page.type(inputSelector, `Killer${sequence}!`);

				await page.waitForTimeout(1000);
				// Use page.select to set the value of the <select> element
				await page.select("#rooms-teams>div>select", roomTeams);

				await page.waitForTimeout(1000);
				// Click a button
				await page.click('#settings-sound');
				await page.click('#settings-music');
				await page.click('#play');

				// Add a delay between checks to avoid constant polling and reduce CPU usage
				await page.waitForTimeout(3 * 1000); // Adjust the delay as needed

				// Get the full page size
				const pageSize = await page.evaluate(() => ({
					width: window.innerWidth,
					height: window.innerHeight,
				}))

				// Move the mouse to coordinates (x, y)
				const x = pageSize.width / 2 - 150; // Replace with your desired x-coordinate
				const y = pageSize.height / 2 - 150; // Replace with your desired y-coordinate
				await page.mouse.move(x, y);

				await page.waitForTimeout(1000);
				console.log(`user ${sequence} started.`)
				playAgain(page, sequence);

				return ""
			} catch (err) {
				openNewPage(sequence);
			}
		}

		for (let i = 0; i < totalUserCount; i++) {
			openNewPage(i);
		}

		// // Close the Puppeteer browser and the launched Chrome instance
		// await browser.close();
		// await chrome.kill();
	} catch (err) {
		console.error('Error launching Chrome:', err);
	}
}

// Call the function to launch Chrome and run Puppeteer
launchChromeAndRunPuppeteer();