import { userid, getUserInfo } from "../Firebase/getUserInfo.js";
import { query, collection, orderBy, limit, onSnapshot, where, startAfter, getDocs, doc, updateDoc, increment, setDoc, deleteDoc, addDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db} from "../Firebase/firebase.js";
import { timeAgo } from "../Firebase/timeAgo.js";
import { EventBus } from "./PopularTags.js";

export const PawLikeButton = {
    template: `
        <div class="paw-like-button"
             @mouseover="hover" 
             @mouseleave="defaultState" 
             @mousedown="pressed" 
             @mouseup="released" 
             @click.stop="toggleLike"
        >
        
            <img src="../Elements/paw.svg" 
                 :class="['paw-svg', stateClass]" 
                 alt="Paw Button" />
        </div>
    `,
    props: {
        buttonId: {
            type: String,
            required: true,
        },
      },
    data() {
        return {
            state: 'default',
            liked: false,
        };
    },
    computed: {
        stateClass() {
            return `paw-${this.state}`;
        },
    },
    mounted() {
        this.getLikedPosts();
        const likedState = localStorage.getItem(this.localStorageKey);
        if (likedState === 'true') {
            this.liked = true;
            this.state = 'final';
        } else {
            this.liked = false;
            this.state = 'default';
        }
        this.updateParentBackground();
    },

    methods: {
        get localStorageKey() {
            return `paw-like-button-${this.buttonId}`;
        },

        defaultState() {
            if (!this.liked) this.state = 'default';
            this.updateParentBackground();
        },

        hover() {
            if (!this.liked) this.state = 'hover';
            this.updateParentBackground();
        },

        async pressed() {
            this.state = 'pressed';
            this.updateParentBackground();
            if (!this.liked) {
                await this.addLikeToDB(this.buttonId);
            } else {
                await this.removeLikeFromDB(this.buttonId);
            }

        },

        released() {
            this.state = 'release';
            this.updateParentBackground();
        },

        toggleLike() {
            this.liked = !this.liked;
            this.state = this.liked ? 'final' : 'default';
            localStorage.setItem(this.localStorageKey, this.liked ? 'true' : 'false');
            this.updateParentBackground();
        },

        updateParentBackground() {
            const parent = this.$el.closest('.paw-ring');
            if (!parent) return;

            parent.classList.remove(
                'paw-background-default',
                'paw-background-hover',
                'paw-background-pressed',
                'paw-background-release',
                'paw-background-liked'
            );

            switch (this.state) {
                case 'hover':
                    parent.classList.add('paw-background-hover');
                    break;
                case 'pressed':
                    parent.classList.add('paw-background-pressed');
                    break;
                case 'release':
                    parent.classList.add('paw-background-release');
                    break;
                case 'final':
                    parent.classList.add('paw-background-liked');
                    break;
                default:
                    parent.classList.add('paw-background-default');
                    break;
            }
        },

        async addLikeToDB(postID) {
            try {
                await updateDoc(doc(db, "posts", postID), {
                    likeCount: increment(1)
                })

                const docRef = doc(db, "posts", postID, "likes", userid);
                await setDoc(docRef, {time: new Date().toISOString()});
                console.log("Like added to DB")
            } catch (error) {
                console.log("Error adding like to DB:", error.code, error.message);
                alert("Error liking post");
            }
        },

        async removeLikeFromDB(postID) {
            try{
                await updateDoc(doc(db, "posts", postID), {
                    likeCount: increment(-1)
                })

                const docRef = doc(db, "posts", postID, "likes", userid);
                await deleteDoc(docRef);

                console.log("Like removed from DB");
                } catch (error) {
                console.log("Error deleting like from DB:", error.code, error.message);
                alert("Error unliking post");
                }
        },

        async getLikedPosts() {
            try {
                const docRef = doc(db, "posts", this.buttonId, "likes", userid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    this.liked = true;
                    this.state = 'final';
                    localStorage.setItem(this.localStorageKey, 'true');
                } else {
                    this.liked = false;
                    this.state = 'default';
                    localStorage.setItem(this.localStorageKey, 'false');
                }
                this.updateParentBackground();
            } catch (error) {
                console.log("Error getting liked posts:", error.code, error.message);
            }
        }
    }
};

export const Post = {
    template: `
        <div class="post-container">
        <div
            v-for="(post, index) in posts"
            :key="post.id"
            class="post"
            :class="{ 'hidden-post': isExpanded && expandedIndex !== index }"
        >
              <div
                  v-if="!isExpanded || expandedIndex !== index"
                  @click="expandPost(index, post.id)"
                  class="post"
              >
                    <img :src="post.image" class="post-image" alt="Post picture"/>
            
                    <div class="post-title">{{ post.title }}</div>
            
                    <div class="post-trending">
                        <div v-for="tag in post.tags" :key="tag" class="post-hastag">#{{ tag }}</div>
                    </div>
            
                    <div class="paw-ring">
                        <paw-like-button :button-id="post.id"></paw-like-button>
                    </div>
            
                    <div class="post-pfp">
                        <img :src="post.authorImage" class="post-pfp-cat" alt="Author profile picture"/>
                    </div>
            
                    <div>
                          <div class="post-name">{{ post.author }}</div>
                          <div class="post-time">{{ post.time }}</div>
                    </div>
            
            
                    <div class="post-info">
                          <div class="post-info-details">{{ post.views }} Views</div>
                          <div class="post-info-details">{{ post.likes }} Likes</div>
                          <div class="post-info-details">{{ post.comments }} Comments</div>
                    </div>
              </div>
            
            
              <div v-else class="post-expanded">
                    <div class="extended-postitus">
                        <button @click.stop="collapsePosts" class="close-button">X</button>
                    
                        <div class="extended-post-pfp">
                            <img :src="post.authorImage" class="extended-post-pfp-cat" alt="Author profile picture"/>
                        </div>
                        <div class="extended-nimi">{{ post.author }}</div>
                        <div class="extended-aeg">{{ post.time }}</div>
                        <h1 class="extended-pealkiri">{{ post.title }}</h1>
                        <div class="extended-content">{{ post.content }}</div>
                        <img :src="post.image" class="extended-pilt" alt="Expanded Post Image"/>
                        <div class="extended-paw">
                            <div class="paw-ring">
                                  <paw-like-button :button-id="post.id"></paw-like-button>
                            </div>
                        </div>
                    </div>
            
                    <div class="leave-comment">
                          <input id="leave-comment" class="leave-comment-text" placeholder="Let’s share what’s going on your mind...">
                          <div class="leave-comment-button" @click="addComment(post.id)">Leave a meow!</div>
                          <div class="leave-comment-pfp">
                                <div class="leave-comment-pfp-cat" :style="{ backgroundImage: 'url(' + currentUser.img + ')' }"></div>
                          </div>
                    </div>
            
                    <hr class="hr1">
                    <div  v-for="comment in comments" :key="comment.id" class="comment-container">
                          <div class="comment-box">
                                <div class="content">
                                      <div class="comment-name">{{comment.author}}</div>
                                      <div class="comment-info">{{comment.date}}</div>
                                      <div class="comment-pfp-circle">
                                            <img class="comment-pfp" :src=comment.profileImg>
                                      </div>
                                      <div class="comment">{{comment.content}}</div>
                                </div>
                          </div>
                    </div>
              </div>
        </div>
    `,
    data() {
        return {
            isExpanded: false,
            expandedIndex: null,
            previousScrollPosition: 0,
            posts: [],
            unsubscribeFeedUpdate: null,
            currentUser: {},
            loading: false,
            lastVisible: null,
            hasMore: true,
            currentOption: "recent",
            currentTag: null,
            unsubscribeListeners: [],
            comments: [],
            commentLastVisible: null,
            hasMoreComments: true,
            commentLoading: false,
            unsubscribeComments: null,
        };
    },
    props: {
        buttonId: {
            type: [String],
            required: true,
        },
    },
    methods: {

        expandPost(index, postID) {
            this.addView(postID)
            this.isExpanded = true;
            this.expandedIndex = index;
            toggleMakePostVisibility(true);
            this.getComments(postID);
            this.scrollHandler = () => this.handleCommentScroll(postID);
            window.addEventListener("scroll", this.scrollHandler);
            this.previousScrollPosition = window.scrollY;
            window.scrollTo(0, 0);
        },

        collapsePosts() {
            this.isExpanded = false;
            this.expandedIndex = null;
            toggleMakePostVisibility(false);
            if (this.unsubscribe) {
                this.unsubscribe();
                this.unsubscribeComments = null;
            }
            window.removeEventListener("scroll", this.scrollHandler);
            this.comments = [];
            this.commentLastVisible = null;
            this.hasMoreComments = true;
            this.commentLoading = false;
            window.scrollTo(0, this.previousScrollPosition);
        },

        async getCurrentUserInfo() {
            const data = await getUserInfo(userid);
            this.currentUser = {
                img: data.profileImg,
                friends: data.friends,
            }
        },

        async loadPosts() {
            if (this.loading || !this.hasMore) return;

            this.loading = true;

            try {
                let queryRef;

                if (this.currentOption === "recent") {
                    queryRef = this.buildRecentQuery();
                } else if (this.currentOption === "popular") {
                    queryRef = this.buildPopularQuery();
                } else if (this.currentTag) {
                    queryRef = this.buildTagQuery(this.currentTag);
                } else if (this.currentOption === "following") {
                    queryRef = this.buildFriendQuery();
                }

                if (this.lastVisible) {
                    queryRef = query(queryRef, startAfter(this.lastVisible), limit(10));
                } else {
                    queryRef = query(queryRef, limit(10));
                }

                const querySnapshot = await getDocs(queryRef);

                const postsPromises = querySnapshot.docs.map(async (doc) => {
                    const author = doc.data().author;
                    const userData = await getUserInfo(author);
                    return {
                        id: doc.id,
                        image: doc.data().picture,
                        title: doc.data().title,
                        tags: doc.data().tags,
                        author: userData.username,
                        authorImage: userData.profileImg || "",
                        time: timeAgo(doc.data().date),
                        views: doc.data().views,
                        likes: doc.data().likeCount,
                        comments: doc.data().commentCount,
                        content: doc.data().content,
                    }
                });

                const resolvedPosts = await Promise.all(postsPromises);

                this.posts.push(...resolvedPosts);

                this.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

                if (querySnapshot.docs.length < 10) {
                    this.hasMore = false;
                }

                 resolvedPosts.forEach((post) => {
                    this.attachPostListener(post.id);
                 });
            } catch (error) {
                console.error("Error loading posts:", error.message);
            } finally {
                this.loading = false;
            }
        },

        buildRecentQuery() {
            return query(
                collection(db, "posts"),
                orderBy("date", "desc")
            );
        },

        buildPopularQuery() {
            const startOfToday = new Date();
            startOfToday.setUTCHours(0, 0, 0, 0);

            return query(
                collection(db, "posts"),
                where("date", ">", startOfToday),
                orderBy("views", "desc")
            );
        },

        buildTagQuery(tag) {
            return query(
                collection(db, "posts"),
                where("tags", "array-contains", tag),
                orderBy("views", "desc")
            );
        },

        buildFriendQuery() {
            return query(
                collection(db, "posts"),
                where("author", "in", this.currentUser.friends),
                orderBy("date", "desc"),
            );
        },

        attachPostListener(postId) {
            const unsubscribe = onSnapshot(doc(db, "posts", postId), (docSnapshot) => {
                const updatedData = docSnapshot.data();
                const postIndex = this.posts.findIndex(post => post.id === postId);
                if (postIndex !== -1) {
                    const updatedPost  = {
                        ...this.posts[postIndex],
                        likes: updatedData.likeCount,
                        views: updatedData.views,
                        comments: updatedData.commentCount,
                    };

                    this.posts[postIndex] = updatedPost;
                }
            });
            this.unsubscribeListeners.push(unsubscribe);
        },

        async updateQuery(option, tag = null) {
            this.posts = [];
            this.lastVisible = null;
            this.hasMore = true;
            this.unsubscribeListeners.forEach(unsubscribe => unsubscribe());
            this.unsubscribeListeners = [];

            this.currentOption = option || this.currentOption;
            this.currentTag = tag;

            await this.loadPosts();
        },

        handleScroll() {
            const scrollPosition = window.innerHeight + window.scrollY;
            const bottomPosition = document.body.offsetHeight - 100;

            if (scrollPosition >= bottomPosition) {
                this.loadPosts();
            }
        },

        handleQueryUpdate(event) {
            const { option, tag } = event.detail || {};

            if (option || tag) {
                this.updateQuery(option, tag);
            }
        },

        async addView(postID) {
            try{
                await updateDoc(doc(db, "posts", postID), {
                    views: increment(1)
                })
                console.log("View added");
            } catch (error) {
                console.log("Error adding view to DB", error.code, error.message);
            }
        },

        async addComment(postID) {
            const comment = document.getElementById("leave-comment").value;

            if (!comment) {
                return
            }

            try {

                await updateDoc(doc(db, "posts", postID), {
                    commentCount: increment(1)
                });

                await addDoc(collection(db, "posts", postID, "comments"), {
                    author: userid,
                    comment: comment,
                    postedAt: serverTimestamp(),
                });
                console.log("Comment added to DB");
                document.getElementById("leave-comment").value = "";
            } catch (error) {
                console.log("Error adding comment to DB", error.code, error.message);
                alert("Error adding comment");
            }
        },

        async getComments(postId) {
            if (this.commentLoading || !this.hasMoreComments) return;

            this.commentLoading = true;

            try {
                const dateFormat = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                };

                let queryRef = query(
                    collection(db, "posts", postId, "comments"),
                    orderBy("postedAt", "desc"),
                );

                if (this.commentLastVisible) {
                    queryRef = query(queryRef, startAfter(this.commentLastVisible), limit(10));
                } else {
                    queryRef = query(queryRef, limit(10));
                }

                 this.unsubscribeComments = onSnapshot(queryRef, async (querySnapshot) => {
                    const comments = await Promise.all(querySnapshot.docs.map(async(doc) => {
                        const data = doc.data();
                        const userData = await getUserInfo(data.author);
                        return {
                            id: doc.id,
                            author: userData.username,
                            profileImg: userData.profileImg,
                            date: data.postedAt.toDate().toLocaleString('en-gb', dateFormat),
                            content: data.comment,
                            notFormattedDate: data.postedAt,
                        }
                    }));

                    const newComments = comments.filter(comment =>
                        !this.comments.some(existingComment => existingComment.id === comment.id));

                    if (!newComments.length) {
                        return
                    }

                    if (this.comments.length && newComments[newComments.length - 1].notFormattedDate
                        > this.comments[0].notFormattedDate) {
                        this.comments = [... newComments, ...this.comments];
                        return;
                    }

                    this.comments = [...this.comments, ...newComments];

                    this.commentLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

                    if (querySnapshot.docs.length < 10) {
                        this.hasMoreComments = false;
                    }

                    this.commentLoading = false;
                });
            } catch (error) {
                console.log("Error fetching comments", error.code, error.message)
            }
        },

        handleCommentScroll(postID) {
            const scrollPosition = window.innerHeight + window.scrollY;
            const bottomPosition = document.body.offsetHeight - 100;

            if (scrollPosition >= bottomPosition) {
                this.getComments(postID);
            }
        },
    },
    mounted() {
        EventBus.addEventListener("sort-post", this.handleQueryUpdate);
        this.getCurrentUserInfo();

        this.loadPosts();
        window.addEventListener("scroll", this.handleScroll);
    },
    beforeUnmount() {
        this.snapshotUnsubscribers.forEach(unsubscribe => unsubscribe());
        this.snapshotUnsubscribers = [];

         EventBus.removeEventListener("update-query", this.handleQueryUpdate);
         window.removeEventListener("scroll", this.handleScroll);
    }
};
