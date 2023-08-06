/**
 * External dependencies
 */

import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { compose, ifCondition } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { PanelBody } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import FlatTermSelector from '../post-taxonomies/flat-term-selector';
import { store as editorStore } from '../../store';

const TagsPanel = () => {
	const panelBodyTitle = [
		__( 'Suggestion:' ),
		<span className="editor-post-publish-panel__link" key="label">
			{ __( 'Add tags' ) }
		</span>,
	];

	return (
		<PanelBody initialOpen={ false } title={ panelBodyTitle }>
			<p>
				{ __(
					'Tags help users and search engines navigate your site and find your content. Add a few keywords to describe your post.'
				) }
			</p>
			<FlatTermSelector slug={ 'post_tag' } />
		</PanelBody>
	);
};

const MaybeTagsPanel = (props) => {


    const [hadTagsWhenOpeningThePanel, setHadTagsWhenOpeningThePanel] = useState(props.hasTags);

    

    if ( ! hadTagsWhenOpeningThePanel ) {
			return <TagsPanel />;
		}

		return null; 
};




export default compose(
	withSelect( ( select ) => {
		const postType = select( editorStore ).getCurrentPostType();
		const tagsTaxonomy = select( coreStore ).getTaxonomy( 'post_tag' );
		const tags =
			tagsTaxonomy &&
			select( editorStore ).getEditedPostAttribute(
				tagsTaxonomy.rest_base
			);
		return {
			areTagsFetched: tagsTaxonomy !== undefined,
			isPostTypeSupported:
				tagsTaxonomy &&
				some( tagsTaxonomy.types, ( type ) => type === postType ),
			hasTags: tags && tags.length,
		};
	} ),
	ifCondition(
		( { areTagsFetched, isPostTypeSupported } ) =>
			isPostTypeSupported && areTagsFetched
	)
)( MaybeTagsPanel );
