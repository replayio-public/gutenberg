/**
 * WordPress dependencies
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import { store as editorStore } from '@wordpress/editor';

/**
 * Returns the Post's Edit URL.
 *
 * @param {number} postId Post ID.
 *
 * @return {string} Post edit URL.
 */
export function getPostEditURL( postId ) {
	return addQueryArgs( 'post.php', { post: postId, action: 'edit' } );
}

/**
 * Returns the Post's Trashed URL.
 *
 * @param {number} postId   Post ID.
 * @param {string} postType Post Type.
 *
 * @return {string} Post trashed URL.
 */
export function getPostTrashedURL( postId, postType ) {
	return addQueryArgs( 'edit.php', {
		trashed: 1,
		post_type: postType,
		ids: postId,
	} );
}

export export const BrowserURL = (props) => {


    const [historyId, setHistoryId] = useState(null);
    const [historyId, setHistoryId] = useState();

    useEffect(() => {
		const { postId, postStatus, postType, isSavingPost } = props;
		

		// Posts are still dirty while saving so wait for saving to finish
		// to avoid the unsaved changes warning when trashing posts.
		if ( postStatus === 'trash' && ! isSavingPost ) {
			setTrashURLHandler( postId, postType );
			return;
		}

		if (
			( postId !== prevProps.postId || postId !== historyId ) &&
			postStatus !== 'auto-draft' &&
			postId
		) {
			setBrowserURLHandler( postId );
		}
	}, [historyId]);
    /**
	 * Navigates the browser to the post trashed URL to show a notice about the trashed post.
	 *
	 * @param {number} postId   Post ID.
	 * @param {string} postType Post Type.
	 */
    const setTrashURLHandler = useCallback(( postId, postType ) => {
		window.location.href = getPostTrashedURL( postId, postType );
	}, []);
    /**
	 * Replaces the browser URL with a post editor link for the given post ID.
	 *
	 * Note it is important that, since this function may be called when the
	 * editor first loads, the result generated `getPostEditURL` matches that
	 * produced by the server. Otherwise, the URL will change unexpectedly.
	 *
	 * @param {number} postId Post ID for which to generate post editor URL.
	 */
    const setBrowserURLHandler = useCallback(( postId ) => {
		window.history.replaceState(
			{ id: postId },
			'Post ' + postId,
			getPostEditURL( postId )
		);

		setHistoryId(postId);
	}, []);

    return null; 
};




export default withSelect( ( select ) => {
	const { getCurrentPost, isSavingPost } = select( editorStore );
	const post = getCurrentPost();
	let { id, status, type } = post;
	const isTemplate = [ 'wp_template', 'wp_template_part' ].includes( type );
	if ( isTemplate ) {
		id = post.wp_id;
	}

	return {
		postId: id,
		postStatus: status,
		postType: type,
		isSavingPost: isSavingPost(),
	};
} )( BrowserURL );
