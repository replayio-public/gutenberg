/**
 * External dependencies
 */

import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useCallback } from '@wordpress/element';
import {
    Button,
    Spinner,
    CheckboxControl,
    withFocusReturn,
    withConstrainedTabbing,
} from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { closeSmall } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export export const PostPublishPanel = (props) => {


    

    useEffect(() => {
		// Automatically collapse the publish sidebar when a post
		// is published and the user makes an edit.
		if (
			prevProps.isPublished &&
			! props.isSaving &&
			props.isDirty
		) {
			props.onClose();
		}
	}, []);
    const onSubmitHandler = useCallback(() => {
		const { onClose, hasPublishAction, isPostTypeViewable } = props;
		if ( ! hasPublishAction || ! isPostTypeViewable ) {
			onClose();
		}
	}, []);

    const {
			forceIsDirty,
			forceIsSaving,
			isBeingScheduled,
			isPublished,
			isPublishSidebarEnabled,
			isScheduled,
			isSaving,
			isSavingNonPostEntityChanges,
			onClose,
			onTogglePublishSidebar,
			PostPublishExtension,
			PrePublishExtension,
			...additionalProps
		} = props;
		const {
			hasPublishAction,
			isDirty,
			isPostTypeViewable,
			...propsForPanel
		} = additionalProps;
		const isPublishedOrScheduled =
			isPublished || ( isScheduled && isBeingScheduled );
		const isPrePublish = ! isPublishedOrScheduled && ! isSaving;
		const isPostPublish = isPublishedOrScheduled && ! isSaving;
		return (
			<div className="editor-post-publish-panel" { ...propsForPanel }>
				<div className="editor-post-publish-panel__header">
					{ isPostPublish ? (
						<Button
							onClick={ onClose }
							icon={ closeSmall }
							label={ __( 'Close panel' ) }
						/>
					) : (
						<>
							<div className="editor-post-publish-panel__header-publish-button">
								<PostPublishButton
									focusOnMount={ true }
									onSubmit={ onSubmitHandler }
									forceIsDirty={ forceIsDirty }
									forceIsSaving={ forceIsSaving }
								/>
							</div>
							<div className="editor-post-publish-panel__header-cancel-button">
								<Button
									disabled={ isSavingNonPostEntityChanges }
									onClick={ onClose }
									variant="secondary"
								>
									{ __( 'Cancel' ) }
								</Button>
							</div>
						</>
					) }
				</div>
				<div className="editor-post-publish-panel__content">
					{ isPrePublish && (
						<PostPublishPanelPrepublish>
							{ PrePublishExtension && <PrePublishExtension /> }
						</PostPublishPanelPrepublish>
					) }
					{ isPostPublish && (
						<PostPublishPanelPostpublish focusOnMount={ true }>
							{ PostPublishExtension && <PostPublishExtension /> }
						</PostPublishPanelPostpublish>
					) }
					{ isSaving && <Spinner /> }
				</div>
				<div className="editor-post-publish-panel__footer">
					<CheckboxControl
						label={ __( 'Always show pre-publish checks.' ) }
						checked={ isPublishSidebarEnabled }
						onChange={ onTogglePublishSidebar }
					/>
				</div>
			</div>
		); 
};




export default compose( [
	withSelect( ( select ) => {
		const { getPostType } = select( coreStore );
		const {
			getCurrentPost,
			getEditedPostAttribute,
			isCurrentPostPublished,
			isCurrentPostScheduled,
			isEditedPostBeingScheduled,
			isEditedPostDirty,
			isSavingPost,
			isSavingNonPostEntityChanges,
		} = select( editorStore );
		const { isPublishSidebarEnabled } = select( editorStore );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );

		return {
			hasPublishAction: get(
				getCurrentPost(),
				[ '_links', 'wp:action-publish' ],
				false
			),
			isPostTypeViewable: get( postType, [ 'viewable' ], false ),
			isBeingScheduled: isEditedPostBeingScheduled(),
			isDirty: isEditedPostDirty(),
			isPublished: isCurrentPostPublished(),
			isPublishSidebarEnabled: isPublishSidebarEnabled(),
			isSaving: isSavingPost(),
			isSavingNonPostEntityChanges: isSavingNonPostEntityChanges(),
			isScheduled: isCurrentPostScheduled(),
		};
	} ),
	withDispatch( ( dispatch, { isPublishSidebarEnabled } ) => {
		const { disablePublishSidebar, enablePublishSidebar } =
			dispatch( editorStore );
		return {
			onTogglePublishSidebar: () => {
				if ( isPublishSidebarEnabled ) {
					disablePublishSidebar();
				} else {
					enablePublishSidebar();
				}
			},
		};
	} ),
	withFocusReturn,
	withConstrainedTabbing,
] )( PostPublishPanel );
