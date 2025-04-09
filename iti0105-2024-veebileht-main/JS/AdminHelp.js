import {db} from "../Firebase/firebase.js";
import { query, collection, orderBy, doc, serverTimestamp, limit, onSnapshot, startAfter, writeBatch } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {getUserInfo, userid} from "../Firebase/getUserInfo.js";

export const AdminHelp = {
    name: 'AdminHelp',
    data() {
        return {
            messages: [],
            activeMessageId: null,
            loading: false,
            lastVisible: null,
            hasMore: true,
            unsubscribe: null,
        };
    },
    methods: {
        selectMessage(messageId) {
            this.activeMessageId = messageId;
            },

        async getUserMessages() {
            try {
                if (this.loading || !this.hasMore) return;

                this.loading = true;

                const dateFormat = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                };

                let queryRef = query(
                    collection(db, "contactUs"),
                    orderBy("time", "asc"),
                );

                if (this.lastVisible) {
                    queryRef = query(queryRef, startAfter(this.lastVisible), limit(1));
                } else {
                    queryRef = query(queryRef, limit(6));
                }

               this.unsubscribe = onSnapshot(queryRef, async (querySnapshot) => {
                   const messages =  await Promise.all(querySnapshot.docs.map(async(doc) => {
                       const data = doc.data();
                       const userData = await getUserInfo(data.senderId);
                       return {
                           id: doc.id,
                           senderId: data.senderId,
                           username: userData.username,
                           avatar: userData.profileImg,
                           message: data.message,
                           time: data.time.toDate().toLocaleString('en-gb', dateFormat) || "",
                       }
                   }));

                   const newMessages = messages.filter(message =>
                       !this.messages.some(existingMessage => existingMessage.id === message.id));

                   if (!newMessages.length) {
                       return
                   }

                   this.messages = [...this.messages, ...newMessages].slice(0, 6);

                   this.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

                   if (querySnapshot.docs.length < 1) {
                       this.hasMore = false;
                   }

                   this.loading = false;
                });
            } catch (error) {
                console.log("Error getting messages", error.code, error.message);
            }
        },

        async sendReply(user, messageId) {
            try {
                const message = document.getElementById("text").value.trim()
                if (!message) {
                    return;
                }

                const batch = writeBatch(db);

                const collectionRef = doc(collection(db, "profiles", user, "notifications"))
                const docRef = doc(db, "contactUs", messageId);

                batch.set(collectionRef, {
                    senderid: "admin",
                    time: serverTimestamp(),
                    message: message,
                });

                batch.delete(docRef);

                await batch.commit();

                document.getElementById("text").value = "";
                alert("Message has been sent!");
                const currentIndex = this.messages.findIndex((msg) => msg.id === messageId);
                this.activeMessageId = null;
                this.messages = this.messages.filter(msg => msg.id !== messageId);
                await this.getUserMessages();

                if (currentIndex >= 0 && currentIndex < this.messages.length) {
                    this.activeMessageId = this.messages[currentIndex].id;
                } else if (this.messages.length > 0) {
                    this.activeMessageId = this.messages[0].id;
                } else {
                    this.activeMessageId = null;
                }
            } catch (error) {
                console.log("Error sending message", error.code, error.message)
                alert("Error sending message!")
            }
        },
    },
    template: `
        <div class="küsimused">User complaints and questions</div>
        <div class="küljeriba">
            <div
                v-for="message in messages"
                :key="message.id"
                class="küljeriba-box"
                :class="{ active: message.id === activeMessageId }"
                @click="selectMessage(message.id)"
            >
                <div class="küljeriba-nimi">{{ message.username }}</div>
                <div class="küljeriba-tekst">
                    {{ message.message }}
                </div>
            </div>
        </div>
        <div class="küsimuse_kast" v-if="activeMessageId !== null">
            <div class="küsimuse_päis">
                <div class="küsimuse_pealkiri">
                    {{ messages.find(msg => msg.id === activeMessageId).time }}
                </div>
                <img class="profiilipilt" :src="messages.find(msg => msg.id === activeMessageId).avatar" alt="Avatar" />
                <div class="nimi">{{ messages.find(msg => msg.id === activeMessageId).username }}</div>
            </div>
            <div class="küsimuse_sisu_kast">
                <div class="küsimus">
                    <div class="küsimuse_sisu">
                        {{ messages.find(msg => msg.id === activeMessageId).message }}
                    </div>
                </div>
                <textarea maxlength="300" id="text" name="text" rows="4" cols="6" placeholder="Type a response..."></textarea>
                <img class="saada" src="../Elements/send_2.svg" @click="sendReply(messages.find(msg => msg.id === activeMessageId).senderId, activeMessageId)"/>
            </div>
        </div>
    `,
    mounted() {
        this.getUserMessages();
    },
    beforeUnmount() {
        this.unsubscribe();
        this.unsubscribe = null;
    },
};
