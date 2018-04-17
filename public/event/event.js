/**
 * Created by GrantBroadwater on 12/18/17.
 */

var ref = firebase.database().ref();
var provider = new firebase.auth.FacebookAuthProvider();
provider.addScope('public_profile');

var eventID = getEventID( window.location.href );

var rideStatus = undefined;
var RideNotRequested = -1;
var RideRequested = 0;
var RideActive = 1;
var userIsTryingToRequestRide = false;

var userRideIDInEventQueue = undefined;

$.Topic( EventDoesExist ).subscribe( function( val ) {

    if ( !eventDoesExist ) {
        window.location.href = "/";
    }

});

$.Topic( EventNameDidChange ).subscribe( function( val ) {

    $(".titleText").text( eventName ? "" + eventName : "" );

});

$.Topic( EventLocationDidChange ).subscribe( function ( val ) {

    $(".supportingText").text( eventLocation ? "" + eventLocation : "" );

});

$.Topic( EventDisabledDidChange ).subscribe( function ( val ) {

    if( eventDisabled ) {
        window.location.href = "/";
    }

});

function checkIfUserIsDiabled( val ) {

    if( eventDisabledUsers && userUID ) {
        var i = 0;
        var eventDisabledUserKeys = Object.keys( eventDisabledUsers );

        while( i < eventDisabledUserKeys.length ) {

            if( eventDisabledUserKeys[ i ] === userUID ) {

                alert( "You are not allowed to view this event" );
                window.location.href = "/";
            }

            i++;
        }
    }

}
$.Topic( EventDisabledUsersDidChange ).subscribe( checkIfUserIsDiabled );
$.Topic( UserUIDDidChange ).subscribe( checkIfUserIsDiabled );

function updateRideStatusValue() {

    if ( userRides ) {

        var userRidesKeys = Object.keys(userRides);

        if ( eventQueue ) {

            var queueKeys = Object.keys( eventQueue );
            var overlap = intersection(queueKeys, userRidesKeys);

            if ( overlap.length > 0 ) {

                userRideIDInEventQueue = overlap[0];
                rideStatus = RideRequested;
                return;

            }
        }

        if ( eventActiveRides ) {

            var eventActiveRidesKeys = Object.keys(eventActiveRides);
            var overlap = intersection(userRidesKeys, eventActiveRidesKeys);

            if ( overlap.length > 0 ) {

                userRideIDInEventQueue = undefined;
                rideStatus = RideActive;
                return;
            }

        }
    }

    userRideIDInEventQueue = undefined;
    rideStatus = RideNotRequested;

}

function updateRideStatus( val ) {

    updateRideStatusValue();

    if ( rideStatus === RideNotRequested ) {

        $("#requestRideBtn").html( "Request a Ride" );
        $("#requestRideBtn").prop('disabled', false);
        $("#requestRideBtn").css('background-color', '#2196f3');

    } else if ( rideStatus === RideRequested ) {

        $("#requestRideBtn").html("Cancel Ride Request");
        $("#requestRideBtn").prop('disabled', false);
        $("#requestRideBtn").css('background-color', 'red');

    } else if ( rideStatus === RideActive ) {

        $("#requestRideBtn").html("Cancel Ride Request");
        $("#requestRideBtn").prop('disabled', true);
        $("#requestRideBtn").css('background-color', 'gray');

    }


}
$.Topic( EventQueueDidChange ).subscribe( updateRideStatus );
$.Topic( UserUIDDidChange ).subscribe( updateRideStatus );
$.Topic( EventActiveRidesDidChange ).subscribe( updateRideStatus );
$.Topic( UserRidesDidChange ).subscribe( updateRideStatus );

var requestRideBtnCounter = 0;

function decrementRequestRideButtonCounter() {
    requestRideBtnCounter--;
}

$("#requestRideBtn").click(function () {

    if( !userUID || !eventID ) {
        return;
    } 

    requestRideBtnCounter++;
    window.setTimeout( decrementRequestRideButtonCounter, 60*1000 );

    if( requestRideBtnCounter >= 10 ) {

        setTimeout( executeCancelRideRequst, 1 );

        var updates = {};

        updates[ "/events/" + eventID + "/disabledUsers/" + userUID ] = userDisplayName;

        ref.update( updates );

        window.location.href = "/";
    }

    if ( rideStatus === RideNotRequested ) {

        executeRequestRide();

    } else if ( rideStatus === RideRequested ) {

        executeCancelRideRequst();

    }

});

var userHasSavedEvent = false;

function updateSavedEvents( val ) {

    userHasSavedEvent = false;

    if( userSavedEvents ) {

        var userSavedEventKeys = Object.keys( userSavedEvents );

        if( eventID ) {

            var i = 0;
            while( i < userSavedEventKeys.length ) {

                if( userSavedEventKeys[ i ] === eventID ) {
                    userHasSavedEvent = true;
                    break;
                }

                i++;
            }
        }
    }

    if( userHasSavedEvent ) {
        $("#saveEventBtn").html("Event Saved!");
    } else {
        $("#saveEventBtn").html("Save Event");
    }
}
$.Topic( UserSavedEventsDidChange ).subscribe( updateSavedEvents );

$("#saveEventBtn").click( function() {

    if( userUID ) {

        if( eventID ) {

            if( userHasSavedEvent ) {

                var updates = {};
                updates[ '/users/' + userUID + "/savedEvents/" + eventID ] 
                    = null;

            } else {

                var updates = {};
                updates[ '/users/' + userUID + "/savedEvents/" + eventID ] 
                    = eventName;


            }

            ref.update(updates);

        } else {

            alert( "Navigate to an event page to save an event." );

        }

    } else {
        
        alert( "You must first sign in to save an event." );

    }

} );

function executeRequestRide() {


    if ( userUID ) {

        $("#requestRideBtn").html( "Loading" );
        $("#requestRideBtn").prop('disabled', true);
        navigator.geolocation.getCurrentPosition( function ( pos ) {

            var rideKey = ref.child("rides").push().key;

            var rideData = {};
            rideData[ 'status' ] = 0;
            rideData[ 'rider' ] = userUID;
            rideData[ 'event' ] = eventID;
            rideData[ 'latitude' ] = pos.coords.latitude;
            rideData[ 'longitude' ] = pos.coords.longitude;

            var updates = {};
            updates[ '/rides/' + rideKey ] = rideData;
            updates[ '/events/' + eventID + '/queue/' + rideKey ] = userUID;
            updates[ '/users/' + userUID + '/rides/' + rideKey ] = eventName;

            ref.update(updates);

        }, function ( error ) {

            alert( "Dede needs access to your location in order to request a ride." );

        });

    } else {

        userIsTryingToRequestRide = true;
        firebase.auth().signInWithRedirect(provider);

    }

}

function executeCancelRideRequst() {

    if ( userUID && userRideIDInEventQueue ) {

        var updates = {};
        updates[ '/rides/' + userRideIDInEventQueue ] = null;
        updates[ '/events/' + eventID + '/queue/' + userRideIDInEventQueue ] = null;
        updates[ '/users/' + userUID + '/rides/' + userRideIDInEventQueue ] = null;

        ref.update(updates);

    } else {

        alert( "An error occured." );

    }


}

createEventModel(eventID);

$.Topic( UserDisplayNameDidChange ).subscribe( function ( value ) {
    $("#SignInText").html( userDisplayName ? "" + userDisplayName.split(" ")[0] : "Sign In");
});

$.Topic( UserUIDDidChange ).subscribe( function ( value ) {

    if ( userUID && userIsTryingToRequestRide ) {
        userIsTryingToRequestRide = false;
        executeRequestRide();
    }

});

$("#SignInButton").click( function () {

    if ( userDoesExist ) {
        firebase.auth().signOut();
    } else {
        firebase.auth().signInWithRedirect(provider);
    }


});
