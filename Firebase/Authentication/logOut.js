import { auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

export function logOut() {
    signOut(auth).then(() => {
        console.log("Logged out");
        window.location.href = "../HTML/index.html";
    }).catch(error => {
        console.log(error)
    })
}
