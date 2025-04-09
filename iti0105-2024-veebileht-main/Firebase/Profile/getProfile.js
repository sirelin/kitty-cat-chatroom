import { db } from "../firebase.js";
import { onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { userid } from "../getUserInfo.js";

export async function getBio() {
    try {
        const docSnap =  await getDoc(doc(db, "profiles", userid));

        if (docSnap.exists()) {
            return docSnap.data().bio || "";
        }
    } catch (error) {
        console.log("Error getting user bio", error.code, error.message);
    }
}

export async function getProfileImg() {
    try {
        const docRef = doc(db, "profiles", userid);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
                 if (docSnap.exists()) {
                     document.getElementById("profileImg").src = docSnap.data().profileImg;
                 }
        });

        return unsubscribe;
    } catch (error) {
        console.log("Error getting user profile pic", error.code, error.message);
    }
}
