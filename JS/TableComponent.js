import {db} from "../Firebase/firebase.js";
import { query, collection, orderBy, updateDoc, doc, serverTimestamp, limit, where, onSnapshot, startAfter } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export const TableComponent = {
    name: 'TableComponent',
    data() {
        return {
            users: [],
            loading: false,
            lastVisible: null,
            hasMore: true,
            unsubscribe: null,
        };
    },
    methods: {
        async unblockUser(user) {
            try {
                await updateDoc(doc(db, "profiles", user), {
                    blocked: false,
                    blockedDate: ""
                });
            } catch (error) {
                console.log("Error unblocking user", error.code, error.message);
                alert("Error unblocking user")
            }
        },

        async getBlockedUsers() {
            try {
                if (this.loading || !this.hasMore) return;

                this.loading = true;
                const dateFormat = {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                    timeZoneName: 'short'
                };

                let queryRef = query(
                    collection(db, "profiles"),
                    where("blocked", "==", true),
                    orderBy("blockedDate", "desc"),
                );

                if (this.lastVisible) {
                    queryRef = query(queryRef, startAfter(this.lastVisible), limit(10));
                } else {
                    queryRef = query(queryRef, limit(10));
                }

                this.unsubscribe = onSnapshot(queryRef, (querySnapshot) => {
                   const users = querySnapshot.docs.map((doc) => {
                       const data = doc.data();
                       return {
                           id: doc.id,
                           username: data.username,
                           date: data.blockedDate.toDate().toLocaleString('en-gb', dateFormat),
                       }
                   });

                   const newUsers = users.filter(user => !this.users.some(existingUser => existingUser.id === user.id));

                   if (!newUsers.length) {
                       return
                   }

                   if (this.users.length && newUsers[newUsers.length - 1].notFormattedDate > this.users[0].notFormattedDate) {
                       this.users = [... newUsers, ...this.users];
                       return;
                   }

                   this.users = [...this.users, ...newUsers];

                   this.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
                   if (querySnapshot.docs.length < 10) {
                       this.hasMore = false;
                   }
                });
            } catch (error) {
                console.log("Error getting users", error.code, error.message);
            }
        },

        handleScroll() {
            const scrollPosition = window.innerHeight + window.scrollY;
            const bottomPosition = document.body.offsetHeight - 100;

            if (scrollPosition >= bottomPosition) {
                this.getBlockedUsers();
            }
        }
    },
    mounted() {
        this.getBlockedUsers();
        window.addEventListener("scroll", this.handleScroll);
    },
    beforeUnmount() {
        this.unsubscribe();
        this.unsubscribe = null;
        window.removeEventListener("scroll", this.handleScroll);
    },
    template: `
        <div class="blocked-table-container">
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Blocked at</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(user) in users" :key="user.id">
                        <td>{{ user.username }}</td>
                        <td>{{ user.date }}</td>
                        <td><button @click="unblockUser(user.id)" class="unblock">Unblock</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
};

export const UserTable = {
    name: 'UserTable',
    template: `
        <div class="users-table-container">
            <table>
                <thead>
                    <tr>
                        <th>UserID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Created At</th>
                        <th>Remove</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(user) in users" :key="user.id">
                        <td>{{ user.id }}</td>
                        <td>{{ user.username }}</td>
                        <td>{{ user.email }}</td>
                        <td>{{ user.date }}</td>
                        <td>
                            Block user - 
                            <button @click="blockUser(user.id)" class="block">
                                <img class="block_nupp" src="../Elements/block.svg" alt="Block user"/>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `,
    data() {
        return {
            users: [],
            loading: false,
            lastVisible: null,
            hasMore: true,
            unsubscribe: null,
        };
    },
    methods: {
        async blockUser(user) {
            try {
                await updateDoc(doc(db, "profiles", user), {
                    blocked: true,
                    blockedDate: serverTimestamp()
                });

                 this.users = this.users.filter(u => u.id !== user);
            } catch (error) {
                console.log("Error blocking user", error.code, error.message);
                alert("Error blocking user");
            }
        },

        async getUsers() {
            try {
                if (this.loading || !this.hasMore) return;

                this.loading = true;

                const dateFormat = {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                    timeZoneName: 'short'
                };

                let queryRef = query(
                    collection(db, "profiles"),
                    where("blocked", "!=", true),
                    orderBy("createdAt", "desc"),
                );

                if (this.lastVisible) {
                    queryRef = query(queryRef, startAfter(this.lastVisible), limit(10));
                } else {
                    queryRef = query(queryRef, limit(10));
                }

               this.unsubscribe = onSnapshot(queryRef, (querySnapshot) => {
                   const users = querySnapshot.docs.map((doc) => {
                       const data = doc.data();
                       return {
                           id: doc.id,
                           username: data.username,
                           email: data.email,
                           date: data.createdAt.toDate().toLocaleString('en-gb', dateFormat),
                           notFormattedDate: data.createdAt,
                       }
                   });

                   const newUsers = users.filter(user => !this.users.some(existingUser => existingUser.id === user.id));

                   if (!newUsers.length) {
                       return
                   }

                   if (this.users.length && newUsers[newUsers.length - 1].notFormattedDate > this.users[0].notFormattedDate) {
                       this.users = [... newUsers, ...this.users];
                       return;
                   }

                   this.users = [...this.users, ...newUsers];

                   this.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

                   if (querySnapshot.docs.length < 10) {
                       this.hasMore = false;
                   }

                   this.loading = false;
                });
            } catch (error) {
                console.log("Error getting users", error.code, error.message);
            }
        },

        handleScroll() {
            const scrollPosition = window.innerHeight + window.scrollY;
            const bottomPosition = document.body.offsetHeight - 1;

            if (scrollPosition >= bottomPosition) {
                this.getUsers();
            }
        }
    },
    mounted() {
        this.getUsers();
        window.addEventListener("scroll", this.handleScroll);
    },
    beforeUnmount() {
        this.unsubscribe();
        this.unsubscribe = null;
        window.removeEventListener("scroll", this.handleScroll);
    },
}