const API_KEY = '6d07f89ba97c19a51d0244e1bc510a3fc5c181b9';
const BASE_URL = 'http://localhost:1280/dolibarr-23.0.3/htdocs/api/index.php';

async function apiClient(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'DOLAPIKEY': API_KEY,
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error ${response.status}: ${err}`);
  }
  if (response.status === 204) return true;
  return response.json();
}

async function run() {
  try {
    const payload = {
      fk_user: 1,
      amount: 1500,
      datep: '2026-06-25',
      datesp: '2026-06-01',
      dateep: '2026-06-30',
      label: 'Salaire Test'
    };
    
    console.log("POST /salaries", payload);
    const res = await apiClient('/salaries', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    console.log("Salary created with ID:", res);
    
    const paymentPayload = {
      paiementtype: 4, 
      datepaye: '2026-06-25',
      amounts: { [res]: 500 },
      chid: 1, accountid: 1
    };
    console.log("POST /salaries/" + res + "/payments", paymentPayload);
    const pres = await apiClient(`/salaries/${res}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentPayload)
    });
    console.log("Payment created:", pres);
    
  } catch (e) {
    console.error(e);
  }
}

run();
