let db;
let budgetVersion;

// Connection with indexDB database
const request = window.indexedDB.open("Budget", 1);

request.onupgradeneeded = (e) => {
  console.log("Upgrade needed in IndexDB");

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version

  console.log(`DB updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('BudgetStore', { autoIncrement: true });
  }
};

request.onerror = (e) => {
  console.log(`Oh No! ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log("Check DB invoked");

  let transaction = db.transaction(['BudgetStore'], 'readwrite');

  const store = transaction.objectStore('BudgetStore');
  // Get all the records from store and set to a variable
  const getAll = store.getAll();
  // If request is successful
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          // If the returned response is not empty
          if (res.length !== 0) {
            // Open another transaction to BudgetStore with the ability to read and write
            transaction = db.transaction(['BudgetStore'], 'readwrite');
            //Assign the current store a variable
            const currentStore = transaction.objectStore('BudgetStorer');

            // Clear the existing entires because the bulk add was successful
            currentStore.clear();
            console.log('Clearing store front!');
          }
        });
    }
  };
};

request.onsuccess = (e) => {
  console.log('Success!');
  db = e.target.result;

  // Check if app is online befroe reading from database
  if (navigator.online) {
    console.log('Backend online! 🗄️');
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log('Save record invoked!');

  const transaction = db.transaction(['BudgetStore'], 'readwrite');

  const store = transaction.objectStore('BudgetStore');
  // Add record to store with add method
  store.add(record)
};
//Listen for app to come back online
window.addEventListener('online', checkDatabase);