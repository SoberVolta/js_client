/**
 * Created by GrantBroadwater on 12/18/17.
 */

function getEventID( url_string ) {

    var querySplit = url_string.split( "?" );
    if( querySplit.length === 1 ) {
        return null;
    }

    var eventSplit = querySplit[ 1 ].split( "=" );
    if( eventSplit[0].toLowerCase().includes( "event" ) || eventSplit[0].toLowerCase().includes( "id" )) {
        return eventSplit[1];
    }

    return null;
}

function include(file)
{

    var script  = document.createElement('script');
    script.src  = file;
    script.type = 'text/javascript';
    script.defer = true;

    document.getElementsByTagName('head').item(0).appendChild(script);

}

var topics = {};

jQuery.Topic = function( id ) {
    var callbacks,
        topic = id && topics[ id ];
    if ( !topic ) {
        callbacks = jQuery.Callbacks();
        topic = {
            publish: callbacks.fire,
            subscribe: callbacks.add,
            unsubscribe: callbacks.remove
        };
        if ( id ) {
            topics[ id ] = topic;
        }
    }
    return topic;
};

function intersection(a, b)
{
    var ai=0, bi=0;
    var result = [];

    while( ai < a.length && bi < b.length )
    {
        if      (a[ai] < b[bi] ){ ai++; }
        else if (a[ai] > b[bi] ){ bi++; }
        else /* they're equal */
        {
            result.push(a[ai]);
            ai++;
            bi++;
        }
    }

    return result;
}

$( "#SignInText" ).text( "Sign In" );
