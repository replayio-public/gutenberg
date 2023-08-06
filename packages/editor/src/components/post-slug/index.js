/**
 * WordPress dependencies
 */

import { withDispatch, withSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { safeDecodeURIComponent, cleanForSlug } from '@wordpress/url';
import { TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export export const PostSlug = (props) => {


    const [editedSlug, setEditedSlug] = useState(safeDecodeURIComponent( postSlug ) ||
				cleanForSlug( postTitle ) ||
				postID);

    const setSlugHandler = useCallback(( event ) => {
		const { postSlug, onUpdateSlug } = props;
		const { value } = event.target;

		const editedSlug = cleanForSlug( value );

		if ( editedSlug === postSlug ) {
			return;
		}

		onUpdateSlug( editedSlug );
	}, [editedSlug]);

    
		return (
			<PostSlugCheck>
				<TextControl
					label={ __( 'Slug' ) }
					autoComplete="off"
					spellCheck="false"
					value={ editedSlug }
					onChange={ ( slug ) =>
						setEditedSlug(slug);
					}
					onBlur={ setSlugHandler }
					className="editor-post-slug"
				/>
			</PostSlugCheck>
		); 
};




export default compose( [
	withSelect( ( select ) => {
		const { getCurrentPost, getEditedPostAttribute } =
			select( editorStore );

		const { id } = getCurrentPost();
		return {
			postSlug: getEditedPostAttribute( 'slug' ),
			postTitle: getEditedPostAttribute( 'title' ),
			postID: id,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost } = dispatch( editorStore );
		return {
			onUpdateSlug( slug ) {
				editPost( { slug } );
			},
		};
	} ),
] )( PostSlug );
