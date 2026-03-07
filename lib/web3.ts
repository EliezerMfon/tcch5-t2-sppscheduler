import { ethers } from "ethers";

export const connectWallet = async() => {
    if (typeof window === "undefined") {
        throw new Error("Window object is not available. This function must be called on the client-side.");
    }

    if (!window.ethereum) {
        throw new Error("Metamask is not installed. Please install MetaMask extension to use this feature.");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { provider, signer, address};
};