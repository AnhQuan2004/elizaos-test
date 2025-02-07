import { type IAgentRuntime, type Memory, type Provider, type State } from "@elizaos/core";
import { interestWords, cringeWords, negativeWords } from "./boredom";

// Calculate sentiment score for a post
const calculatePostScore = (post: string): number => {
    let score = 0;
    const postText = post.toLowerCase();

    // Use interest words as positive indicators
    interestWords.forEach(word => {
        if (postText.includes(word)) score += 1;
    });

    // Use negative words as negative indicators
    negativeWords.forEach(word => {
        if (postText.includes(word)) score -= 1;
    });

    // Use cringe words to reduce score
    cringeWords.forEach(word => {
        if (postText.includes(word)) score -= 0.5;
    });

    // Add score for emojis
    if (post.includes('��')) score += 1;
    if (post.includes('🔥')) score += 1;
    if (post.includes('��')) score -= 1;
    if (post.includes('⚠️')) score -= 1;

    return score;
};

const postProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        // Create requestId using userId instead of user
        const requestId = `${message.createdAt}-${message.userId}`;
        console.log('🆔 Request ID:', requestId);

        // Skip if already processed
        if (state?.lastProcessedRequest === requestId) {
            console.log('⏭️ Skipping duplicate request');
            return null;
        }

        // Force using post for market/status questions
        const forcePost = message.content.text.toLowerCase().match(/how('s|\sis)?\s+(defi|market|btc|bitcoin|l2|security)/i);
        
        console.log('🔍 PostProvider called with message:', message.content.text);
        console.log('Force post:', !!forcePost);
        
        const messageText = message.content.text.toLowerCase();
        console.log('📝 Analyzing message:', messageText);

        // Calculate sentiment score for message
        let sentimentScore = 0;
        
        // Use same scoring logic as posts
        interestWords.forEach(word => {
            if (messageText.includes(word)) {
                sentimentScore += 1;
            }
        });
        
        negativeWords.forEach(word => {
            if (messageText.includes(word)) {
                sentimentScore -= 1;
            }
        });

        cringeWords.forEach(word => {
            if (messageText.includes(word)) {
                sentimentScore -= 0.5;
            }
        });
        
        console.log('💯 Sentiment Score:', sentimentScore);
        
        // Force sentiment to be either positive or negative
        const sentimentLabel = sentimentScore >= 0 ? 'positive' : 'negative';
        
        console.log('🏷️ Sentiment Label:', sentimentLabel);

        console.log('📚 Available posts:', runtime.character.postExamples?.length);
        const postExamples = runtime.character.postExamples || [];
        console.log('🔍 PostExamples:', postExamples);
        
        // Get all example posts from character config
        let relevantPosts = [];

        // Calculate sentiment scores for all posts first
        const scoredPosts = postExamples.map(post => ({
            content: post,
            score: calculatePostScore(post)
        }));
        
        // Filter posts by topic first
        const topicPosts = scoredPosts.filter(post => {
            const postText = post.content.toLowerCase();
            if (messageText.includes('defi')) {
                return postText.includes('defi') || postText.includes('yield');
            }
            if (messageText.includes('market')) {
                return postText.includes('market') || postText.includes('update');
            }
            if (messageText.includes('security')) {
                return postText.includes('security') || postText.includes('alert');
            }
            return true; // If no specific topic, include all
        });

        // Then sort by sentiment similarity
        topicPosts.sort((a, b) => {
            // If user sentiment is positive, prioritize positive posts
            if (sentimentLabel === 'positive') {
                return b.score - a.score;
            }
            // If negative, prioritize negative posts
            return a.score - b.score;
        });
        
        console.log('📊 All posts with scores:', topicPosts);

        // Store requestId in state
        if (state) {
            state.lastProcessedRequest = requestId;
        }
        // Log the response data
        console.log('📊 Post provider response:', {
            sentiment: sentimentLabel,
            posts: topicPosts
        });

        // Return format that matches the expected provider response
        return {
            content: {
                provider: {
                    name: 'post',
                    text: JSON.stringify({
                        sentiment: sentimentLabel,
                        posts: topicPosts
                    }, null, 2),
                    force: true
                }
            }
        };
    }
};

export { postProvider }; 