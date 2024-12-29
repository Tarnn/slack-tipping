import { ACCOUNT_FACTORY, THIRDWEB_ENGINE_BACKEND_WALLET, TIP_TOKEN } from "~/constants";

import { ACCOUNT_FACTORY_ADMIN } from "~/constants";

import { CHAIN } from "~/constants";
import { env } from "~/env";

export const getAddressByUserId = async (userId: string) => {
  const baseUrl = new URL(`${env.THIRDWEB_ENGINE_URL}/contract/${CHAIN.id}/${ACCOUNT_FACTORY}/account-factory`);

  const getAddressUrl = new URL(`${baseUrl}/predict-account-address`);
  getAddressUrl.searchParams.set('adminAddress', ACCOUNT_FACTORY_ADMIN);
  getAddressUrl.searchParams.set('extraData', userId);

  const fetchOptions = {
    headers: {
      Authorization: `Bearer ${env.THIRDWEB_ENGINE_ACCESS_TOKEN}`,
    },
    method: 'GET',
  };

  try {
    const addressResponse = await fetch(getAddressUrl, fetchOptions);
    const addressData = await addressResponse.json() as { result: string };
    return addressData.result;
  } catch (error) {
    console.error(`Error getting address for user ${userId}:`, error);
    throw error;
  }
};

export const isAddressRegistered = async (address: string) => {
  const isRegisteredUrl = new URL(`${env.THIRDWEB_ENGINE_URL}/contract/${CHAIN.id}/${TIP_TOKEN}/read`);
  isRegisteredUrl.searchParams.set('functionName', 'isRegistered');
  isRegisteredUrl.searchParams.set('args', address);
  const fetchOptions = {
    headers: {
      Authorization: `Bearer ${env.THIRDWEB_ENGINE_ACCESS_TOKEN}`,
    },
    method: 'GET',
  };

  try {
    const response = await fetch(isRegisteredUrl, fetchOptions);
    const data = await response.json() as { result: boolean };
    console.log(`isRegistered for address ${address}:`, JSON.stringify(data, null, 2));
    return data.result;
  } catch (error) {
    console.error(`Error getting isRegistered for address ${address}:`, error);
    throw error;
  }
}

export const registerAccount = async (address: string) => {
  const baseUrl = new URL(`${env.THIRDWEB_ENGINE_URL}/contract/${CHAIN.id}/${TIP_TOKEN}/write`);
  const registerUrl = new URL(`${baseUrl}/register-account`);

  const fetchOptions = {
    headers: {
      'Authorization': `Bearer ${env.THIRDWEB_ENGINE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'x-backend-wallet-address': THIRDWEB_ENGINE_BACKEND_WALLET,
      'x-idempotency-key': `register-account-${address}`,
    },
    method: 'POST',
    body: JSON.stringify({
      functionName: `registerAccount(address)`,
      args: [address],
      abi: [{
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "registerAccount",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }]
    })
  };

  try {
    const response = await fetch(registerUrl, fetchOptions);
    const data = await response.json() as { result: { queueId: string } };
    return data.result;
  } catch (error) {
    console.error(`Error registering account for address ${address}:`, error);
    throw error;
  }
}

export const isAddressDeployed = async (address: string) => {
  const baseUrl = new URL(`${env.THIRDWEB_ENGINE_URL}/contract/${CHAIN.id}/${ACCOUNT_FACTORY}/account-factory`);
  const isDeployedUrl = new URL(`${baseUrl}/is-account-deployed`);
  isDeployedUrl.searchParams.set('adminAddress', ACCOUNT_FACTORY_ADMIN);
  isDeployedUrl.searchParams.set('address', address);

  const fetchOptions = {
    headers: {
      Authorization: `Bearer ${env.THIRDWEB_ENGINE_ACCESS_TOKEN}`,
    },
    method: 'GET',
  };

  try {
    const response = await fetch(isDeployedUrl, fetchOptions);
    const data = await response.json() as { result: boolean };
    return data.result;
  } catch (error) {
    console.error(`Error getting isDeployed for address ${address}:`, error);
    throw error;
  }
};

export const deployAccount = async (userId: string) => {
  const baseUrl = new URL(`${env.THIRDWEB_ENGINE_URL}/contract/${CHAIN.id}/${ACCOUNT_FACTORY}/account-factory`);
  const createAccountUrl = new URL(`${baseUrl}/create-account`);

  const fetchOptions = {
    headers: {
      'Authorization': `Bearer ${env.THIRDWEB_ENGINE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'x-backend-wallet-address': ACCOUNT_FACTORY_ADMIN,
      'x-idempotency-key': `deploy-account-${userId}`,
      'x-account-factory-address': ACCOUNT_FACTORY,
      'x-account-salt': userId
    },
    method: 'POST',
    body: JSON.stringify({
      adminAddress: ACCOUNT_FACTORY_ADMIN,
    })
  };

  try {
    const response = await fetch(createAccountUrl, fetchOptions);
    const data = await response.json() as { 
      result: {
        queueId: string;
        deployedAddress: string;
      }
    };
    return data.result;
  } catch (error) {
    console.error(`Error deploying account for user ${userId}:`, error);
    throw error;
  }
}