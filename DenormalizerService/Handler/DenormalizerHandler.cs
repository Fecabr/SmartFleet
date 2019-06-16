﻿using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DenormalizerService.Infrastructure;
using MassTransit;
using SmartFleet.Core.Contracts.Commands;
using SmartFleet.Core.Data;
using SmartFleet.Core.Domain.Gpsdevices;
using SmartFleet.Core.Domain.Movement;
using SmartFleet.Core.Domain.Vehicles;
using SmartFleet.Core.ReverseGeoCoding;
using SmartFleet.Data;

namespace DenormalizerService.Handler
{
    public class DenormalizerHandler : IConsumer<CreateTk103Gps>, 
        IConsumer<CreateNewBoxGps>, 
        IConsumer<TLGpsDataEvent>,
        IConsumer<CreateBoxCommand>,
        IConsumer<TlFuelEevents>,
        IConsumer<TLExcessSpeedEvent>,
        IConsumer<TLEcoDriverAlertEvent>
    {
        private readonly IDbContextScopeFactory _dbContextScopeFactory;
        private readonly ReverseGeoCodingService _geoCodingService;
        private static SemaphoreSlim _semaphore;

        private SmartFleetObjectContext _db;

        public DenormalizerHandler()
        {
            _semaphore = new SemaphoreSlim(1, 1);
            _geoCodingService = new ReverseGeoCodingService();
            _dbContextScopeFactory = DependencyRegistrar.ResolveDbContextScopeFactory();
        }

        public async Task Consume(ConsumeContext<CreateTk103Gps> context)
        {
            using (var contextFScope = _dbContextScopeFactory.Create())
            {
                _db = contextFScope.DbContexts.Get<SmartFleetObjectContext>();
                Box box;
                using (DbContextTransaction scope = _db.Database.BeginTransaction())
                {
                     box = await _db.Boxes.FirstOrDefaultAsync(x => x.SerialNumber == context.Message.SerialNumber)
                        .ConfigureAwait(false);
                    scope.Commit();

                }

                if (box == null)
                {
                    box = new Box();
                    box.Id = Guid.NewGuid();
                    box.BoxStatus = BoxStatus.Prepared;
                    box.CreationDate = DateTime.UtcNow;
                    box.LastGpsInfoTime = context.Message.TimeStampUtc;

                    box.Icci = String.Empty;
                    box.PhoneNumber = String.Empty;
                    box.Vehicle = null;
                    box.Imei = context.Message.IMEI;
                    box.SerialNumber = context.Message.SerialNumber;
                    try
                    {
                        _db.Boxes.Add(box);
                    }
                    catch (Exception e)
                    {
                        Trace.WriteLine(e);
                    }

                }

                if (box.BoxStatus == BoxStatus.WaitInstallation)
                    box.BoxStatus = BoxStatus.Prepared;
                box.LastGpsInfoTime = context.Message.TimeStampUtc;
                var address = await _geoCodingService.ExecuteQuery(context.Message.Latitude, context.Message.Longitude);
                Position position = new Position
                {
                    Box_Id = box.Id,
                    Altitude = 0,
                    Direction = 0,

                    Lat = context.Message.Latitude,
                    Long = context.Message.Longitude,
                    Speed = context.Message.Speed,
                    Id = Guid.NewGuid(),
                    Priority = 0,
                    Satellite = 0,
                    Timestamp = context.Message.TimeStampUtc,
                    Address = address.display_name,
                    MotionStatus = (int)context.Message.Speed > 2 ? MotionStatus.Moving : MotionStatus.Stopped
                };
                _db.Positions.Add(position);
                await contextFScope.SaveChangesAsync().ConfigureAwait(false);

            }
        }

        public async Task Consume(ConsumeContext<CreateNewBoxGps> context)
        {
            using (var contextFScope = _dbContextScopeFactory.Create())
            {
                _db = contextFScope.DbContexts.Get<SmartFleetObjectContext>();
                Box box;
                using (DbContextTransaction scope = _db.Database.BeginTransaction())
                {
                    box = await _db.Boxes.FirstOrDefaultAsync(x => x.SerialNumber == context.Message.SerialNumber)
                        .ConfigureAwait(false);
                    scope.Commit();

                }
                if (box == null)
                {
                    box = new Box();
                    box.Id = Guid.NewGuid();
                    box.BoxStatus = BoxStatus.Prepared;
                    box.CreationDate = DateTime.UtcNow;
                    box.LastGpsInfoTime = context.Message.TimeStampUtc;

                    box.Icci = String.Empty;
                    box.PhoneNumber = String.Empty;
                    box.Vehicle = null;
                    box.Imei = context.Message.IMEI;
                    box.SerialNumber = context.Message.SerialNumber;
                    try
                    {
                        _db.Boxes.Add(box);
                    }
                    catch (Exception e)
                    {
                        Trace.WriteLine(e);
                    }

                }
                if (box.BoxStatus == BoxStatus.WaitInstallation)
                    box.BoxStatus = BoxStatus.Prepared;
                box.LastGpsInfoTime = context.Message.TimeStampUtc;
                var address = await _geoCodingService.ExecuteQuery(context.Message.Latitude, context.Message.Longitude);
                Position position = new Position
                {
                    Box_Id = box.Id,
                    Altitude = 0,
                    Direction = 0,
                    Lat = context.Message.Latitude,
                    Long = context.Message.Longitude,
                    Speed = context.Message.Speed,
                    Id = Guid.NewGuid(),
                    Priority = 0,
                    Satellite = 0,
                    Timestamp = context.Message.TimeStampUtc,
                    Address = address.display_name,
                    MotionStatus = (int)context.Message.Speed > 2 ? MotionStatus.Moving : MotionStatus.Stopped
                };
                _db.Positions.Add(position);
                await contextFScope.SaveChangesAsync().ConfigureAwait(false);
            }
        }
        private async Task<Box> Item(TLGpsDataEvent context)
        {
            using (var contextFScope = _dbContextScopeFactory.Create())
            {
                _db = contextFScope.DbContexts.Get<SmartFleetObjectContext>();
                return await _db.Boxes.SingleOrDefaultAsync(b => b.Imei == context.Imei);

            }

        }
        public async Task Consume(ConsumeContext<TLGpsDataEvent> context)
        {
            try
            {
                var item = await Item(context.Message);
                if (item != null)
                {
                    using (var contextFScope = _dbContextScopeFactory.Create())
                    {
                        _db = contextFScope.DbContexts.Get<SmartFleetObjectContext>();

                        var position = new Position();
                        position.Box_Id = item?.Id;
                        position.Altitude = context.Message.Altitude;
                        position.Direction = context.Message.Direction;
                        position.Lat = context.Message.Lat;
                        position.Long = context.Message.Long;
                        position.Speed = context.Message.Speed;
                        position.Address = context.Message.Address;
                        position.Id = Guid.NewGuid();
                        position.Priority = context.Message.Priority;
                        position.Satellite = context.Message.Satellite;
                        position.Timestamp = context.Message.DateTimeUtc;
                        position.MotionStatus =  context.Message.Speed > 0.0 ? MotionStatus.Moving : MotionStatus.Stopped;
                        item.LastGpsInfoTime = context.Message.DateTimeUtc;
                        _db.Positions.Add(position);
                       await contextFScope.SaveChangesAsync().ConfigureAwait(false);
                    }


                }
            }
            catch (Exception e)
            {
                Trace.WriteLine(e);
                //throw;
            }
        }

        public async Task Consume(ConsumeContext<CreateBoxCommand> context)
        {
            using (var contextFScope = _dbContextScopeFactory.Create())
            {
                _db = contextFScope.DbContexts.Get<SmartFleetObjectContext>();

                var item = await _db.Boxes.FirstOrDefaultAsync(b => b.Imei == context.Message.Imei);
              if(item!=null)
                  return;
                var box = new Box();
                box.Id = Guid.NewGuid();
                box.BoxStatus = BoxStatus.WaitPreparation;
                box.CreationDate = DateTime.UtcNow;
                box.Icci = String.Empty;
                box.PhoneNumber = String.Empty;
                box.Vehicle = null;
                box.Imei = context.Message.Imei;
                box.SerialNumber = String.Empty;

                try
                {
                    _db.Boxes.Add(box);
                    await contextFScope.SaveChangesAsync().ConfigureAwait(false);
                }
                catch (Exception e)

                {
                    Trace.WriteLine(e);
                    throw;
                }
            }
        }

        public async Task Consume(ConsumeContext<TlFuelEevents> context)
        {
            //await _semaphore.WaitAsync();

            using (var contextFScope = _dbContextScopeFactory.Create())
            {
                _db = contextFScope.DbContexts.Get<SmartFleetObjectContext>();
                var fuelRecordMsg = context.Message.Events.OrderBy(x => x.DateTimeUtc).Last();

                var lastRecord = await _db.FuelConsumptions.OrderByDescending(x => x.DateTimeUtc)
                    // ReSharper disable once TooManyChainedReferences
                    .FirstOrDefaultAsync(x => x.VehicleId == fuelRecordMsg.VehicleId);
                var entity = SetFuelConsumptionobject(fuelRecordMsg);
                // ReSharper disable once ComplexConditionExpression
                if (lastRecord != null && fuelRecordMsg.MileStoneCalculated || lastRecord==null )
                {
                    if (lastRecord!=null)
                        entity.Milestone+= lastRecord.Milestone;

                    _db.FuelConsumptions.Add(entity);
                    await contextFScope.SaveChangesAsync().ConfigureAwait(false);
                }

              //  _semaphore.Release();
            }
        }

        private static FuelConsumption SetFuelConsumptionobject(TLFuelMilstoneEvent context)
        {
            var entity = new FuelConsumption();

            entity.VehicleId = context.VehicleId;
            entity.FuelUsed = context.FuelConsumption;
            entity.FuelLevel = context.FuelLevel;
            entity.Milestone = context.Milestone;
            entity.CustomerId = context.CustomerId;
            entity.DateTimeUtc = context.DateTimeUtc;
            //entity.TotalFuelConsumed += context.Message.FuelConsumption;
            return entity;
        }

        public async Task Consume(ConsumeContext<TLExcessSpeedEvent> context)
        {
            //throw new NotImplementedException();
            using (var contextFScope = _dbContextScopeFactory.Create())
            {
                _db = contextFScope.DbContexts.Get<SmartFleetObjectContext>();
                _db.VehicleAlerts.Add(new VehicleAlert
                {
                    Id = Guid.NewGuid(),
                    VehicleEvent =  context.Message.VehicleEventType,
                    Speed =Convert.ToInt32( context.Message.Speed),
                    EventUtc = context.Message.EventUtc,
                    CustomerId = (Guid) context.Message.CustomerId,
                    VehicleId = context.Message.VehicleId
                });
                await contextFScope.SaveChangesAsync().ConfigureAwait(false);

            }
        }

        public async Task Consume(ConsumeContext<TLEcoDriverAlertEvent> context)
        {
            //throw new NotImplementedException();
        }
    }
}
