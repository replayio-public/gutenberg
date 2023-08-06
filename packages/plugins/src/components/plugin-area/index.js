/**
 * External dependencies
 */


/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { addAction, removeAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { PluginErrorBoundary } from '../plugin-error-boundary';
import { getPlugins } from '../../api';

/**
 * A component that renders all plugin fills in a hidden div.
 *
 * @example
 * ```js
 * // Using ES5 syntax
 * var el = wp.element.createElement;
 * var PluginArea = wp.plugins.PluginArea;
 *
 * function Layout() {
 * 	return el(
 * 		'div',
 * 		{ scope: 'my-page' },
 * 		'Content of the page',
 * 		PluginArea
 * 	);
 * }
 * ```
 *
 * @example
 * ```js
 * // Using ESNext syntax
 * import { PluginArea } from '@wordpress/plugins';
 *
 * const Layout = () => (
 * 	<div>
 * 		Content of the page
 * 		<PluginArea scope="my-page" />
 * 	</div>
 * );
 * ```
 *
 * @return {WPComponent} The component to be rendered.
 */
const PluginArea = (props) => {


    

    const getCurrentPluginsStateHandler = useCallback(() => {
		return {
			plugins: getPlugins( props.scope ).map(
				( { icon, name, render } ) => {
					return {
						Plugin: render,
						context: memoizedContextHandler( name, icon ),
					};
				}
			),
		};
	}, []);
    useEffect(() => {
		addAction(
			'plugins.pluginRegistered',
			'core/plugins/plugin-area/plugins-registered',
			setPluginsHandler
		);
		addAction(
			'plugins.pluginUnregistered',
			'core/plugins/plugin-area/plugins-unregistered',
			setPluginsHandler
		);
	}, []);
    useEffect(() => {
    return () => {
		removeAction(
			'plugins.pluginRegistered',
			'core/plugins/plugin-area/plugins-registered'
		);
		removeAction(
			'plugins.pluginUnregistered',
			'core/plugins/plugin-area/plugins-unregistered'
		);
	};
}, []);
    const setPluginsHandler = useCallback(() => {
		setStateHandler( getCurrentPluginsStateHandler );
	}, []);

    return (
			<div style={ { display: 'none' } }>
				{ plugins.map( ( { context, Plugin } ) => (
					<PluginContextProvider
						key={ context.name }
						value={ context }
					>
						<PluginErrorBoundary
							name={ context.name }
							onError={ props.onError }
						>
							<Plugin />
						</PluginErrorBoundary>
					</PluginContextProvider>
				) ) }
			</div>
		); 
};




export default PluginArea;
