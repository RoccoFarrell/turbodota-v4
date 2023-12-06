import SteamAuth from 'node-steam-openid'

interface SteamAuthOptions {
    realm: string
    returnUrl: string
    apiKey: string
}

let initialization: SteamAuthOptions = {
    realm: "http://localhost:5173", // Site name displayed to users on logon
    returnUrl: "http://localhost:5173/api/auth/steam/authenticate", // Your return route
    apiKey: "EE3C24BAF27E921B77EFF80F9DBB969D" // Steam API key
}

if(process.env.NODE_ENV !== "development"){
    initialization = {
        realm: "https://new.turbodota.com", // Site name displayed to users on logon
        returnUrl: "https://new.turbodota.com/api/auth/steam/authenticate", // Your return route
        apiKey: "EE3C24BAF27E921B77EFF80F9DBB969D" // Steam API key
    }
}
const steam = new SteamAuth(initialization);

export default steam