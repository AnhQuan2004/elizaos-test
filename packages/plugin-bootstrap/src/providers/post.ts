import { type IAgentRuntime, type Memory, type State } from "@elizaos/core";

interface Provider {
  name?: string;
  priority?: number; 
  description?: string;
  get: (runtime: IAgentRuntime, message: Memory, state?: State) => Promise<any>;
}

const postProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        // Force using post for market/status questions
        const forcePost = message.content.text.toLowerCase().match(/how('s|\sis)?\s+(defi|market|btc|bitcoin|l2|security)/i);
        
        console.log('🔍 PostProvider called with message:', message.content.text);
        console.log('Force post:', !!forcePost);
        
        const messageText = message.content.text.toLowerCase();
        
        console.log('📚 Available posts:', runtime.character.postExamples?.length);
        const postExamples = runtime.character.postExamples || [];
        console.log('🔍 PostExamples:', postExamples);
        
        // Get all example posts from character config
        let relevantPosts = [];

        
        // Market/Price updates
        if (messageText.includes('price') || 
            messageText.includes('market') || 
            messageText.includes('trend') ||
            messageText.includes('btc') ||
            messageText.includes('bitcoin')) {
            relevantPosts = postExamples.filter(post => 
                post.includes('MARKET UPDATE') || 
                post.includes('$BTC') ||
                post.includes('Technical Analysis') ||
                post.includes('Top Performing')
            );
        }
        
        // DeFi/Yield
        else if (messageText.includes('defi') || 
                 messageText.includes('yield') || 
                 messageText.includes('farming')) {
            console.log('🎯 DeFi keyword matched in message');
            relevantPosts = postExamples.filter(post => {
                console.log('🔍 Checking post:', post.substring(0, 50) + '...');
                return post.includes('YIELD REPORT') ||
                       post.includes('DeFi Tips') ||
                       post.includes('APR');
            });
            console.log('✅ Found relevant posts:', relevantPosts.length);
            console.log('🔍 Relevant posts:', relevantPosts);
            if (relevantPosts.length > 0) {
                console.log('📝 Selected post:', relevantPosts[0].substring(0, 100) + '...');
            }
        }
        
        // Security
        else if (messageText.includes('security') || 
                 messageText.includes('safe') || 
                 messageText.includes('protect')) {
            relevantPosts = postExamples.filter(post => 
                post.includes('SECURITY ALERT') ||
                post.includes('Security Tips')
            );
        }
        
        // Layer 2/Scaling
        else if (messageText.includes('layer 2') || 
                 messageText.includes('l2') || 
                 messageText.includes('scaling')) {
            relevantPosts = postExamples.filter(post => 
                post.includes('Layer 2') ||
                post.includes('Scaling')
            );
        }

        // If no specific match, return most recent market update
        if (relevantPosts.length === 0) {
            relevantPosts = postExamples.filter(post => 
                post.includes('MARKET UPDATE') ||
                post.includes('Top Performing')
            );
        }

        // Return the most relevant post
        const selectedPost = relevantPosts[0] || '';
        if (forcePost && !selectedPost) {
            console.log('❌ No relevant post found but force post is true');
        }
        return {
            relevantPosts: relevantPosts,
            text: selectedPost,
            force: !!forcePost
        };

    }
};

export { postProvider }; 