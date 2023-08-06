/**
 * WordPress dependencies
 */

import { useEffect, useCallback } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * AutosaveMonitor invokes `props.autosave()` within at most `interval` seconds after an unsaved change is detected.
 *
 * The logic is straightforward: a check is performed every `props.interval` seconds. If any changes are detected, `props.autosave()` is called.
 * The time between the change and the autosave varies but is no larger than `props.interval` seconds. Refer to the code below for more details, such as
 * the specific way of detecting changes.
 *
 * There are two caveats:
 * * If `props.isAutosaveable` happens to be false at a time of checking for changes, the check is retried every second.
 * * The timer may be disabled by setting `props.disableIntervalChecks` to `true`. In that mode, any change will immediately trigger `props.autosave()`.
 */
export export const AutosaveMonitor = (props) => {


    

    useEffect(() => {
		if ( ! props.disableIntervalChecks ) {
			setAutosaveTimerHandler();
		}
	}, []);
    useEffect(() => {
		if ( props.disableIntervalChecks ) {
			if ( props.editsReference !== prevProps.editsReference ) {
				props.autosave();
			}
			return;
		}

		if ( props.interval !== prevProps.interval ) {
			clearTimeout( timerIdHandler );
			setAutosaveTimerHandler();
		}

		if ( ! props.isDirty ) {
			needsAutosaveHandler = false;
			return;
		}

		if ( props.isAutosaving && ! prevProps.isAutosaving ) {
			needsAutosaveHandler = false;
			return;
		}

		if ( props.editsReference !== prevProps.editsReference ) {
			needsAutosaveHandler = true;
		}
	}, []);
    useEffect(() => {
    return () => {
		clearTimeout( timerIdHandler );
	};
}, []);
    const setAutosaveTimerHandler = useCallback(() => {
		timerIdHandler = setTimeout( () => {
			autosaveTimerHandlerHandler();
		}, timeout );
	}, []);
    const autosaveTimerHandlerHandler = useCallback(() => {
		if ( ! props.isAutosaveable ) {
			setAutosaveTimerHandler( 1000 );
			return;
		}

		if ( needsAutosaveHandler ) {
			needsAutosaveHandler = false;
			props.autosave();
		}

		setAutosaveTimerHandler();
	}, []);

    return null; 
};




export default compose( [
	withSelect( ( select, ownProps ) => {
		const { getReferenceByDistinctEdits } = select( coreStore );

		const {
			isEditedPostDirty,
			isEditedPostAutosaveable,
			isAutosavingPost,
			getEditorSettings,
		} = select( editorStore );

		const { interval = getEditorSettings().autosaveInterval } = ownProps;

		return {
			editsReference: getReferenceByDistinctEdits(),
			isDirty: isEditedPostDirty(),
			isAutosaveable: isEditedPostAutosaveable(),
			isAutosaving: isAutosavingPost(),
			interval,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => ( {
		autosave() {
			const { autosave = dispatch( editorStore ).autosave } = ownProps;
			autosave();
		},
	} ) ),
] )( AutosaveMonitor );
