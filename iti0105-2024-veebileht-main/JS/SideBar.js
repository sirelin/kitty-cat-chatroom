import { logOut } from "../Firebase/Authentication/logOut.js"
import { db } from "../Firebase/firebase.js"
import { addDoc, collection, serverTimestamp, doc, onSnapshot, arrayRemove, query, where, limit, getDocs, arrayUnion, writeBatch, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { username, userid, getUserInfo } from "../Firebase/getUserInfo.js";
import { createChat } from "../Firebase/Messages/addMessage.js"

export const SideBar = {
    template: `
        <div>
            <button v-if="isMobile && !sidebarVisible" 
                    @click="toggleSidebar" 
                    class="sidebar-toggle-button">
                ☰
            </button>
          
            <div v-if="sidebarVisible" 
                    :class="['sidebar', { 'sidebar-modal': isMobile }]">
                <button v-if="isMobile" class="close-button" @click="closeSidebar">✕</button>
               
                <button v-for="(button, index) in buttons" 
                        :key="index" 
                        class="sidebar-button"
                        @click="handleButtonClick(button)">
                    {{ button }}
                </button>
            </div>
      
            <div v-if="sidebarVisible && isMobile" 
                class="sidebar-overlay show" 
                @click="closeSidebar">
            </div>
      
            <div v-if="showModal" class="modal-overlay" @click="closeModal">
                <div class="modal-content" @click.stop>
                    <h2>{{ currentButton }}</h2>
                    <div v-if="currentButton === 'Settings'" class="settings">
                        <div>
                            <div class="settings">
                                <div class="privacy">Privacy: We’re purr-oud to say your privacy is our top paw-iority! Your data is safe in our kitty paws and will never be sold or shared without your purr-mission.</div>
                                <div class="security">Security: Our claws are out when it comes to protecting your data! We’ve got meow-some security measures to keep your information safe from any curious cats or sneaky intruders.</div>
                                <div class="functional">
                                    <div class="buttons" @click="changeCursor('black-paw')">Black Paw</div>
                                    <div class="buttons" @click="changeCursor('white-paw')">White Paw</div>
                                    <div class="buttons" @click="changeCursor('orange-paw')">Orange Paw</div>
                                    
                                      
                                </div>
                            </div>  
                        </div>
                    </div>
                    <div v-else-if="currentButton === 'Contact us'" class="contact">
                        <div>
                            <div class="h4">Need help? We're just a message away!</div>
                            <textarea maxlength="300" class="contact_us" id="text" name="text" rows="4" cols="6" placeholder="Drop us a message"></textarea>
                            <div class="send_button" @click="sendMessage">Send</div>
                        </div>
                    </div>
                    <div v-else-if="currentButton === 'Notifications'" class="notifications">
                        <div v-for="notification in notifications" :key="notification.id" class="noti_box">
                            <img v-if="notification.image" class="noti_pic" :src="notification.image"/>
                            <div class="h3">{{notification.username}}</div>
                            <div class="h4">{{notification.content}}</div>
                        </div>
                    </div>
                    <div v-else-if="currentButton === 'Manage friends'" class="friends">
                        <div>
                            <div class="add_friend">
                                <textarea class="add_friend_search" id="add_friend_search" name="text" rows="4" cols="6" placeholder="Got friends? Add them now!"></textarea>
                                <div class="add" @click="addFriend()">Add friend</div>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th class="h3">Username</th>
                                        <th class="h3">Remove</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="friend in friends" :key="friend.id">
                                        <td class="h4">{{friend.name}}</td>
                                        <td><img class="block" @click="removeFriend(friend.id)" src="../Elements/block.svg"/></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <button @click="closeModal">Close</button>
                </div>
            </div>
        </div>
    `,

    data() {
        return {
            buttons: ["Settings", "Contact us", "Notifications", "Manage friends", "Log out"],
            showModal: false,
            currentButton: "",
            sidebarVisible: false,
            isMobile: document.documentElement.clientWidth < 1320,
            friends: [],
            notifications: [],
            unsubscribe: null,
        };
    },

    methods: {
        openModal(button) {
            this.currentButton = button;
            this.showModal = true;
        },

        handleButtonClick(button) {

            console.log(`Button clicked: ${button}`);

            if (button === "Log out") {
                console.log("Redirecting to logout page...");
                logOut();
                return;
            }
            if (button === "Manage friends")
                this.getFriends();
            if (button === "Notifications") {
                this.getNotifications();
            }
            this.openModal(button);
        },

        closeModal() {
            if (this.currentButton === "Notifications") {
                this.removeNotifications();
            }
            this.showModal = false;
            this.currentButton = "";
            if (this.unsubscribe) {
                this.unsubscribe();
                this.unsubscribe = null;
            }
        },

        toggleSidebar() {
            this.sidebarVisible = !this.sidebarVisible;
        },

        closeSidebar() {
            this.sidebarVisible = false;
        },

        checkScreenSize() {
            this.isMobile = document.documentElement.clientWidth < 1320;
            if (!this.isMobile) {
                this.sidebarVisible = true;
            } else {
                this.sidebarVisible = false;
            }
        },
        async sendMessage() {

            try {
                const message = document.getElementById("text").value.trim()
                if (!message) {
                    alert("Please enter a message before sending.");
                    return;
                }

                await addDoc(collection(db, "contactUs"), {
                    senderId: userid,
                    time: serverTimestamp(),
                    message: message,
                });

                document.getElementById("text").value = "";
                alert("Your message has been sent!");
            } catch (error) {
                console.log("Error sending message", error.code, error.message)
                alert("Your message was not sent. Please try again!")
            }
        },

        async getFriends() {
            try {
                const docRef = doc(db, "profiles", userid);

                const unsubscribe = onSnapshot(docRef, async (doc) => {
                    const data = doc.data().friends || [];
                    const friendsData = await Promise.all(data.map(async (friendId) => {
                        const friend = await getUserInfo(friendId);
                        return {id: friendId, name: friend.username};
                    }));

                    this.friends = friendsData;
                    this.unsubscribe = unsubscribe;
                });
                return unsubscribe;
            } catch (error) {
                console.log("Error getting friends", error.code, error.message);
            }
        },

        async removeFriend(friendId) {
            const batch = writeBatch(db);

            const userRef1 = doc(db, "profiles", userid);
            const userRef2 = doc(db, "profiles", friendId);


            batch.update(userRef1, {
                friends: arrayRemove(friendId),
            });
            batch.update(userRef2, {
                friends: arrayRemove(userid),
            });

            const notificationRef = doc(collection(db, "profiles", friendId, "notifications"));
            batch.set(notificationRef, {
                sender: username,
                senderid: userid,
                message: "removed you",
                time: serverTimestamp(),
            });

            try {
                await batch.commit();
                this.friends = this.friends.filter(friend => friend.id !== friendId);
            } catch (error) {
                console.log("Error removing friend", error.code, error.message);
                alert("Error removing friend");
            }
        },

        async addFriend() {
            try {
                const name = document.getElementById("add_friend_search").value;

                if (!name || name === username) {
                    return
                }

                const userQuery = query(
                    collection(db, "profiles"),
                    where("username", "==", name),
                    limit(1)
                );

                const docSnap = await getDocs(userQuery);
                if (docSnap.empty) {
                    alert("No matches found. Make sure the username is correct and try again!")
                    return;
                }

                const data = docSnap.docs[0].data();
                const friendNames = this.friends.map(friend => friend.name);
                if (friendNames.includes(data.username)) {
                    alert("User is already your friend.");
                    return;
                }

                await this.addFriendsToDBAndSendNotification(docSnap.docs[0].id)
                await createChat(docSnap.docs[0].id)

            } catch (error) {
                console.log("Error adding friend", error.message, error.code);
                alert("Error adding friend");
            }
        },

        async addFriendsToDBAndSendNotification(friendId) {
            const batch = writeBatch(db);

            const userRef1 = doc(db, "profiles", userid);
            const userRef2 = doc(db, "profiles", friendId);

            batch.update(userRef1, {
                friends: arrayUnion(friendId),
            });
            batch.update(userRef2, {
                friends: arrayUnion(userid),
            });

            const notificationRef = doc(collection(db, "profiles", friendId, "notifications"));
            batch.set(notificationRef, {
                sender: username,
                senderid: userid,
                message: "added you",
                time: serverTimestamp(),
            });

            try {
                await batch.commit();
            } catch (error) {
                throw error;
            }
        },

        async getNotifications() {
            try {

                const notificationsRef = collection(db, "profiles", userid, "notifications");

                const notificationsQuery = query(notificationsRef, orderBy("time", "desc"), limit(7));

                const unsubscribe = onSnapshot(notificationsQuery, async (snapshot) => {
                    const notificationsPromises = snapshot.docs.map(async doc => {
                        const data = doc.data();
                        let userData = null;
                        if (data.senderid !== "admin") {
                           userData = await getUserInfo(data.senderid)
                        }
                        return {
                            id: doc.id,
                            name: data.name,
                            content: data.message,
                            username: userData?.username || data.senderid,
                            image: userData?.profileImg || "",
                        }
                    });

                    this.notifications = await Promise.all(notificationsPromises);
                    this.unsubscribe = unsubscribe;
                });
                return unsubscribe;
            } catch (error) {
                console.log("Error getting notifications", error.code, error.message);
            }
        },

        async removeNotifications() {
            try {
                const ids = this.notifications.map(notification => notification.id);

                const batch = writeBatch(db);
                ids.forEach((id) => {
                    const docRef = doc(db, "profiles", userid, "notifications", id);
                    batch.delete(docRef);
                });

                await batch.commit();
            } catch (error) {
                console.error("Error deleting notifications: ", error.code, error.message);
            }
        },

        changeCursor(type) {
          // Save cursor type to localStorage
          localStorage.setItem('cursorType', type);
          // Apply the cursor immediately
          this.applyCursor(type);
        },

        applyCursor(type) {
          // Apply the cursor based on the type
          if (type === 'black-paw') {
            document.body.style.cursor = "url('/Elements/black-paw.png'), auto";
          } else if (type === 'white-paw') {
            document.body.style.cursor = "url('/Elements/white-paw.png'), auto";
          } else if (type === 'orange-paw') {
            document.body.style.cursor = "url('/Elements/orange-paw.png'), auto";
          } else {
            document.body.style.cursor = "default";
          }

        },

    },

    mounted() {
        this.checkScreenSize();
        window.addEventListener('resize', this.checkScreenSize);

        const savedCursor = localStorage.getItem('cursorType');
        if (savedCursor) {
            this.applyCursor(savedCursor);
        }
    },

    beforeDestroy() {
        window.removeEventListener('resize', this.checkScreenSize);
    },

    beforeUnmount() {
        window.removeEventListener('resize', this.checkScreenSize);
    },
};
