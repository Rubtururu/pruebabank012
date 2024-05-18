document.addEventListener('DOMContentLoaded', async () => {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();

        const contractAddress = '0xE66e4dAB4f6e7D05C24D3B2D91aEfEa3aaCAb844'; // Dirección del contrato desplegado
        const contractABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"ClaimDividends","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdrawal","type":"event"},{"inputs":[],"name":"ceoAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claimDividends","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"firstDepositTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTimeRemainingForNextDividendPayment","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastDividendsPaymentTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalDeposits","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalDividendsPool","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalTreasuryPool","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"userDeposits","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"userDividends","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"userDividendsClaimed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"userWithdrawals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}];

        const contract = new web3.eth.Contract(contractABI, contractAddress);

        const accounts = await web3.eth.getAccounts();
        const userAccount = accounts[0];

        updateStats(); // Actualizar estadísticas iniciales

        // Event listeners para los botones de depositar, retirar y reclamar dividendos
        document.getElementById('deposit-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = document.getElementById('deposit-amount').value;
            await contract.methods.deposit().send({ from: userAccount, value: web3.utils.toWei(amount, 'ether') });
            updateStats();
            document.getElementById('deposit-amount').value = ''; // Limpiar el campo después del depósito
        });

        document.getElementById('withdraw-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = document.getElementById('withdraw-amount').value;
            await contract.methods.withdraw(web3.utils.toWei(amount, 'ether')).send({ from: userAccount });
            updateStats();
            document.getElementById('withdraw-amount').value = ''; // Limpiar el campo después del retiro
        });

        document.getElementById('claim-dividends').addEventListener('click', async () => {
            await contract.methods.claimDividends().send({ from: userAccount });
            updateStats();
        });

        async function updateStats() {
            // Obtenemos las estadísticas del contrato
            const totalDeposits = await contract.methods.totalDeposits().call();
            const totalTreasuryPool = await contract.methods.totalTreasuryPool().call();
            const totalDividendsPool = await contract.methods.totalDividendsPool().call();
            const lastDividendsPaymentTime = await contract.methods.lastDividendsPaymentTime().call();
            const contractBalance = await contract.methods.getContractBalance().call();

            // Obtenemos las estadísticas del usuario
            const userDeposits = await contract.methods.userDeposits(userAccount).call();
            const userWithdrawals = await contract.methods.userWithdrawals(userAccount).call();
            const userDividendsToday = await contract.methods.getUserAvailableDividends(userAccount).call();
            const userCurrentDeposit = parseInt(userDeposits) - parseInt(userWithdrawals); // Convertir a números antes de la resta
            const userTotalWithdrawals = userWithdrawals;
            const userTotalDividends = await contract.methods.userDividendsClaimed(userAccount).call();

            // Actualizamos los elementos HTML con las estadísticas obtenidas
            document.getElementById('total-deposits').innerText = web3.utils.fromWei(totalDeposits, 'ether');
            document.getElementById('total-treasury-pool').innerText = web3.utils.fromWei(totalTreasuryPool, 'ether');
            document.getElementById('total-dividends-pool').innerText = web3.utils.fromWei(totalDividendsPool, 'ether');
            document.getElementById('last-dividends-payment-time').innerText = new Date(lastDividendsPaymentTime * 1000).toLocaleString();
            document.getElementById('contract-balance').innerText = web3.utils.fromWei(contractBalance, 'ether');
            document.getElementById('user-dividends-today').innerText = web3.utils.fromWei(userDividendsToday, 'ether');
            document.getElementById('user-total-dividends').innerText = web3.utils.fromWei(userTotalDividends, 'ether');
            document.getElementById('user-deposits').innerText = web3.utils.fromWei(userDeposits, 'ether');
            document.getElementById('user-withdrawals').innerText = web3.utils.fromWei(userWithdrawals, 'ether');
        }

        // Función para calcular el tiempo restante hasta el próximo pago de dividendos
        function calcularTiempoRestanteParaPago() {
            // Obtener la fecha y hora actuales en UTC
            const ahora = new Date();
            const horaActualUTC = ahora.getUTCHours();
            const minutosActualesUTC = ahora.getUTCMinutes();
            const segundosActualesUTC = ahora.getUTCSeconds();

            // Calcular la cantidad de tiempo hasta las 20:00 UTC
            let horasRestantes = 20 - horaActualUTC;
            let minutosRestantes = 0;
            let segundosRestantes = 0;

            // Si ya es después de las 20:00 UTC, calcular el tiempo hasta las 20:00 UTC del día siguiente
            if (horaActualUTC >= 20) {
                horasRestantes = 24 - (horaActualUTC - 20);
            }

            // Calcular los minutos y segundos restantes
            if (minutosActualesUTC > 0 || segundosActualesUTC > 0) {
                horasRestantes--;
                minutosRestantes = 60 - minutosActualesUTC;
                segundosRestantes = 60 - segundosActualesUTC;
            }

            // Retornar el tiempo restante como objeto
            return {
                horas: horasRestantes,
                minutos: minutosRestantes,
                segundos: segundosRestantes
            };
        }

        // Función para actualizar el contador de cuenta atrás
        function actualizarContador() {
            // Obtener el elemento del contador
            const contador = document.getElementById('countdown-timer');

            // Calcular el tiempo restante
            const tiempoRestante = calcularTiempoRestanteParaPago();

            // Mostrar el tiempo restante en el contador
            contador.textContent = `${tiempoRestante.horas}h ${tiempoRestante.minutos}m ${tiempoRestante.segundos}s`;
        }

        // Función para inicializar el contador de cuenta atrás
        function inicializarContador() {
            // Actualizar el contador cada segundo
            setInterval(actualizarContador, 1000);
        }

        // Inicializar el contador al cargar la página
        inicializarContador();

    } else {
        alert('Por favor, instala MetaMask para utilizar esta aplicación.');
    }
});





