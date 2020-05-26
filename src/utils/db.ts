import Keyv from 'keyv'

const db = (namespace: string) => new Keyv(`sqlite://${process.env.DB_PATH}`, { namespace })

export default db
