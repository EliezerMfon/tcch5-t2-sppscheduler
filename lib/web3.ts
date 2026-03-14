import { ethers } from "ethers";

// Wait for MetaMask to inject window.ethereum (it can be slow on page load)
function waitForEthereum(timeout = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.ethereum) {
      resolve();
      return;
    }

    const interval = setInterval(() => {
      if (window.ethereum) {
        clearInterval(interval);
        clearTimeout(timer);
        resolve();
      }
    }, 100);

    const timer = setTimeout(() => {
      clearInterval(interval);
      reject(new Error("MetaMask not detected. Please install MetaMask and refresh the page."));
    }, timeout);
  });
}

export const connectWallet = async () => {
  if (typeof window === "undefined") {
    throw new Error("This function must be called on the client side.");
  }

  // Wait up to 3 seconds for MetaMask to inject
  await waitForEthereum(3000);

  if (!window.ethereum) {
    throw new Error("MetaMask not detected. Please install MetaMask and refresh the page.");
  }

  // Check specifically for MetaMask (not just any wallet)
  if (!window.ethereum.isMetaMask) {
    throw new Error("Please use MetaMask to connect your wallet.");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { provider, signer, address };
  } catch (err: any) {
    if (err.code === 4001 || err.code === "ACTION_REJECTED") {
      throw new Error("Rejected Connection Request.");
    }
    throw err;
  }
};