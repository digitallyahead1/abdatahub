/**
 * Health check script for AB Data Hub services
 * Usage: node scripts/health-check.js
 */

const http = require('http')

const services = [
    { name: 'Frontend', url: 'http://localhost:3000', timeout: 5000 },
    { name: 'Backend', url: 'http://localhost:3001', timeout: 5000 },
    { name: 'API Docs', url: 'http://localhost:3001/api/docs', timeout: 5000 },
    { name: 'PgAdmin', url: 'http://localhost:5050', timeout: 5000 },
    { name: 'Redis Commander', url: 'http://localhost:8081', timeout: 5000 },
]

async function checkHealth() {
    console.log('\n🔍 Checking AB Data Hub Services Health...\n')

    let allHealthy = true

    for (const service of services) {
        try {
            await new Promise((resolve, reject) => {
                const request = http.get(service.url, { timeout: service.timeout }, (res) => {
                    if (res.statusCode >= 200 && res.statusCode < 500) {
                        resolve()
                    } else {
                        reject(new Error(`Status: ${res.statusCode}`))
                    }
                })

                request.on('timeout', () => {
                    request.destroy()
                    reject(new Error('Timeout'))
                })

                request.on('error', reject)
            })

            console.log(`✅ ${service.name.padEnd(20)} → Available at ${service.url}`)
        } catch (error) {
            console.log(`❌ ${service.name.padEnd(20)} → Unavailable (${error.message})`)
            allHealthy = false
        }
    }

    console.log('\n' + '='.repeat(60))

    if (allHealthy) {
        console.log('✨ All services are running! Start developing...\n')
        process.exit(0)
    } else {
        console.log('⚠️  Some services are down. Run: docker-compose up -d\n')
        process.exit(1)
    }
}

checkHealth()