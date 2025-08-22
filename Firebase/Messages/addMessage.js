import { db } from "../firebase.js";
import { arrayUnion, collection, doc, serverTimestamp, writeBatch, updateDoc, getDoc, addDoc} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { userid, username } from "../getUserInfo.js";

export async function createChat(otherid) {
    try {
        const chatId = userid < otherid ? `${userid}_${otherid}` : `${otherid}_${userid}`;

        const batch = writeBatch(db)

        const chatRef = doc(db, "chats", chatId);

        const chatSnapshot = await getDoc(chatRef);

         if (chatSnapshot.exists()) {
             console.log("Chat already exists");
             return;
         }

        batch.set(chatRef, {
            participants: [userid, otherid],
            time: serverTimestamp(),
        });

        for (const user of [userid, otherid]) {
            batch.update(doc(db, "profiles", user), {
                chats: arrayUnion(chatId)
            });
        }

        await batch.commit();
        console.log("ChatID added");
        return chatId;
    } catch (error) {
        console.log("Error adding chat", error.code, error.message);
    }
}
