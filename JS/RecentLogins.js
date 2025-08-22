import { query, collection, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db } from '../Firebase/firebase.js'

export const RecentLogins = {
    name: 'RecentLogins',
    data() {
        return {
            logins: []
        }
    },
    template: `
        <div class="tumeroosa_kast">
            <div class="recent-logins-title">Recent logins:</div>
            <ul class="logins-list">
                <li v-for="login in logins" :key="login.name" class="login-item">
                    {{ login.name }} - {{ login.date }}
                </li>
            </ul>
        </div>
    `,
    methods : {

        async getRecentLogins() {
            try {
                const dateFormat = {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                    timeZoneName: 'short'
                };

                const dataQuery = query(
                    collection(db, "profiles"),
                    orderBy("recentLogin", "desc"),
                    limit(9)
                );

                const unsubscribe = onSnapshot((dataQuery), (querySnap) => {
                    this.logins = querySnap.docs.map((doc) => {
                        return {
                            name: doc.data().username,
                            date: doc.data().recentLogin.toDate().toLocaleString('en-gb', dateFormat),
                        };
                    });
                });

                return unsubscribe
            } catch (error) {
            console.log("Error fetching recent logins", error.code, error.message)
            }
        }
    },
    mounted() {
        this.getRecentLogins()
    },
    beforeUnmount() {
        this.unsubscribe()
    }
};
