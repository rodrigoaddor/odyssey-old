import Keyv from 'keyv'

const db = new Keyv(`sqlite://${process.env.DB_PATH}`)

export default db
